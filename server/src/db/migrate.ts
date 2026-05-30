import db from './index';

export function migrateData() {
  console.log('开始数据迁移修复...');

  const migrationVersion = '20260531_v1';
  const existingVersion = db.prepare('SELECT value FROM configs WHERE key = ?').get('migration_version') as { value: string } | undefined;

  if (existingVersion && existingVersion.value >= migrationVersion) {
    console.log(`✅ 数据已迁移到版本 ${existingVersion.value}，跳过`);
    return;
  }

  const tx = db.transaction(() => {
    const today = new Date().toISOString().split('T')[0];

    console.log('1. 修复今日预约状态...');
    const todayBookings = db.prepare(`
      SELECT id, member_id, status, checkin_at, completed_at
      FROM bookings
      WHERE booking_date = ?
    `).all(today) as { id: number; member_id: number; status: string; checkin_at: string | null; completed_at: string | null }[];

    console.log(`  今日预约共 ${todayBookings.length} 条`);

    const updateBookingStatus = db.prepare(`
      UPDATE bookings
      SET status = ?, checkin_operator_id = ?, complete_operator_id = ?
      WHERE id = ?
    `);

    todayBookings.forEach(booking => {
      const hasValidCheckin = booking.checkin_at && booking.checkin_at.trim().length > 12;
      const hasValidComplete = booking.completed_at && booking.completed_at.trim().length > 12;

      if (hasValidComplete) {
        if (booking.status !== 'completed') {
          updateBookingStatus.run('completed', 4, 4, booking.id);
          console.log(`  预约 ${booking.id}: 已完成 → status=completed`);
        }
      } else if (hasValidCheckin) {
        if (booking.status !== 'checked_in') {
          updateBookingStatus.run('checked_in', 4, null, booking.id);
          console.log(`  预约 ${booking.id}: 使用中 → status=checked_in`);
        }
      } else {
        if (booking.status !== 'booked') {
          updateBookingStatus.run('booked', null, null, booking.id);
          console.log(`  预约 ${booking.id}: 待签到 → status=booked`);
        }
        const fixInvalidCheckin = db.prepare(`
          UPDATE bookings SET checkin_at = NULL WHERE id = ? AND (checkin_at IS NULL OR LENGTH(TRIM(checkin_at)) < 12)
        `);
        fixInvalidCheckin.run(booking.id);
      }
    });

    console.log('2. 修复消费交易 source_id 关联...');
    const fixTxSourceId = db.prepare(`
      UPDATE wallet_transactions
      SET source_id = CASE
        WHEN remark LIKE '%球道消费 - 2小时%' AND member_id = 1 THEN 1
        WHEN remark LIKE '%球道消费 - 2小时%' AND member_id = 2 THEN 2
        WHEN remark LIKE '%球道消费 - 2.5小时%' AND member_id = 3 THEN 3
        WHEN remark LIKE '%球道消费 - 2小时%' AND member_id = 1 AND id = 9 THEN 4
        WHEN remark LIKE '%球道消费 - 2小时%' AND member_id = 4 THEN 5
        WHEN remark LIKE '%球道消费 - 2小时%' AND member_id = 5 THEN 6
        WHEN remark LIKE '%球道消费 - 2小时%' AND member_id = 10 THEN 7
        WHEN remark LIKE '%球道消费 - 2小时%' AND member_id = 2 AND id = 13 THEN 8
        ELSE source_id
      END
      WHERE source = 'booking' AND source_id IS NULL
    `);
    const fixResult = fixTxSourceId.run();
    console.log(`  修复了 ${fixResult.changes} 条交易的 source_id`);

    console.log('3. 修复异常工单关联...');

    const disputeTx = db.prepare(`
      SELECT id FROM wallet_transactions
      WHERE member_id = 8 AND type = 'consume' AND reconciliation_status = 'mismatched'
      ORDER BY id DESC LIMIT 1
    `).get() as { id: number } | undefined;

    const disputeBooking = db.prepare(`
      SELECT id FROM bookings
      WHERE member_id = 8 AND booking_date = (SELECT DATE('now', '-1 day'))
      ORDER BY id ASC LIMIT 1
    `).get() as { id: number } | undefined;

    const damageBooking = db.prepare(`
      SELECT id FROM bookings
      WHERE member_id = 9 AND booking_date = (SELECT DATE('now', '-1 day'))
      ORDER BY id ASC LIMIT 1
    `).get() as { id: number } | undefined;

    const damageEquipRecord = db.prepare(`
      SELECT id, damage_fee FROM equipment_records
      WHERE member_id = 9 AND return_status = 'damaged'
      ORDER BY id DESC LIMIT 1
    `).get() as { id: number; damage_fee: number } | undefined;

    let damageTxId: number | null = null;

    if (damageEquipRecord && damageEquipRecord.damage_fee > 0) {
      const existingDamageTx = db.prepare(`
        SELECT id FROM wallet_transactions
        WHERE member_id = 9 AND type = 'consume' AND source = 'equipment'
        ORDER BY id DESC LIMIT 1
      `).get() as { id: number } | undefined;

      if (!existingDamageTx) {
        console.log('  为器材损坏创建赔偿交易...');
        const damageFee = damageEquipRecord.damage_fee;
        const insertDamageTx = db.prepare(`
          INSERT INTO wallet_transactions (wallet_id, member_id, type, amount, principal_amount, gift_amount, source, source_id, operator_id, remark, reconciliation_status)
          VALUES (?, ?, 'consume', ?, ?, 0, 'equipment', NULL, 4, ?, 'pending')
        `);
        const result = insertDamageTx.run(9, 9, damageFee, damageFee, `器材损坏赔偿 - 一号木杆杆头划痕`);
        damageTxId = result.lastInsertRowid as number;
        console.log(`  创建赔偿交易，ID=${damageTxId}，金额=${damageFee}`);

        const updateWallet = db.prepare(`
          UPDATE wallets
          SET principal_balance = principal_balance - ?, updated_at = CURRENT_TIMESTAMP
          WHERE member_id = 9
        `);
        updateWallet.run(damageFee);
        console.log(`  扣减会员9账户本金 ${damageFee} 元`);
      } else {
        damageTxId = existingDamageTx.id;
        console.log(`  赔偿交易已存在，ID=${damageTxId}`);
      }
    }

    const updateException = db.prepare(`
      UPDATE exceptions
      SET related_transaction_id = ?, related_booking_id = ?
      WHERE id = ?
    `);

    if (disputeTx && disputeBooking) {
      updateException.run(disputeTx.id, disputeBooking.id, 1);
      console.log(`  工单1(消费争议): 关联交易=${disputeTx.id}, 关联预约=${disputeBooking.id}`);
    }

    if (damageBooking) {
      updateException.run(damageTxId, damageBooking.id, 2);
      console.log(`  工单2(器材损坏): 关联交易=${damageTxId}, 关联预约=${damageBooking.id}`);
    }

    const bookingErrorBooking = db.prepare(`
      SELECT id FROM bookings
      WHERE member_id = 5 AND booking_date = (SELECT DATE('now', '-1 day')) AND start_time = '15:00'
    `).get() as { id: number } | undefined;

    if (bookingErrorBooking) {
      updateException.run(null, bookingErrorBooking.id, 3);
      console.log(`  工单3(预约冲突): 关联预约=${bookingErrorBooking.id}`);
    }

    const serviceComplaintBooking = db.prepare(`
      SELECT id FROM bookings
      WHERE member_id = 7 AND booking_date = ? AND start_time = '14:00'
    `).get(today) as { id: number } | undefined;

    if (serviceComplaintBooking) {
      updateException.run(null, serviceComplaintBooking.id, 4);
      console.log(`  工单4(服务投诉): 关联预约=${serviceComplaintBooking.id}`);
    }

    console.log('✅ 数据迁移修复完成');

    db.prepare(`
      INSERT OR REPLACE INTO configs (key, value, description, updated_by, updated_at)
      VALUES ('migration_version', ?, '数据迁移版本号', 1, CURRENT_TIMESTAMP)
    `).run(migrationVersion);
  });

  try {
    tx();
  } catch (err) {
    console.error('❌ 数据迁移失败:', err);
    throw err;
  }
}
