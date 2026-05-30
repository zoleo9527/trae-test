import { hashPassword } from '../utils';
import db from './index';

export async function seedSampleData() {
  const tx = db.transaction(() => {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    if (userCount.count > 0) {
      console.log('数据已存在，跳过初始化');
      return;
    }

    console.log('开始初始化样例数据...');

    const hashedPassword = hashPassword('123456');

    db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone)
      VALUES
        ('manager', ?, 'manager', '张经理', '13800138001'),
        ('coach1', ?, 'coach', '李教练', '13800138002'),
        ('coach2', ?, 'coach', '王教练', '13800138003'),
        ('reception1', ?, 'reception', '赵前台', '13800138004'),
        ('reception2', ?, 'reception', '钱前台', '13800138005')
    `).run(hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword);

    const memberTypes = ['normal', 'silver', 'gold', 'diamond'];
    const memberNames = [
      { name: '陈建国', phone: '13900139001', type: 'diamond' },
      { name: '刘志强', phone: '13900139002', type: 'gold' },
      { name: '王丽华', phone: '13900139003', type: 'gold' },
      { name: '赵文博', phone: '13900139004', type: 'silver' },
      { name: '孙晓峰', phone: '13900139005', type: 'silver' },
      { name: '周美琳', phone: '13900139006', type: 'normal' },
      { name: '吴大海', phone: '13900139007', type: 'normal' },
      { name: '郑小刚', phone: '13900139008', type: 'normal' },
      { name: '冯雅婷', phone: '13900139009', type: 'silver' },
      { name: '何志远', phone: '13900139010', type: 'gold' }
    ];

    const insertMember = db.prepare(`
      INSERT INTO members (name, phone, member_type, birthday, remark, created_by)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const insertWallet = db.prepare(`
      INSERT INTO wallets (member_id, principal_balance, gift_balance, frozen_balance)
      VALUES (?, ?, ?, 0)
    `);

    memberNames.forEach((member, index) => {
      const result = insertMember.run(
        member.name,
        member.phone,
        member.type,
        `198${(index % 9) + 1}-0${(index % 9) + 1}-${(index % 28) + 1}`,
        member.type === 'diamond' ? 'VIP会员，享受专属服务' : null
      );

      const memberId = result.lastInsertRowid as number;

      const principalBalances = [50000, 20000, 15000, 8000, 6000, 2000, 1500, 800, 5000, 18000];
      const giftBalances = [5000, 2000, 1500, 800, 600, 200, 150, 80, 500, 1800];

      insertWallet.run(memberId, principalBalances[index], giftBalances[index]);
    });

    const bayTypes = [
      { name: '普通球道', type: 'normal', rate: 80 },
      { name: 'VIP球道', type: 'vip', rate: 150 },
      { name: '教练球道', type: 'coach', rate: 200 }
    ];

    const insertBay = db.prepare(`
      INSERT INTO bays (name, bay_number, status, type, hourly_rate)
      VALUES (?, ?, 'available', ?, ?)
    `);

    for (let i = 1; i <= 24; i++) {
      const typeIndex = i <= 18 ? 0 : (i <= 22 ? 1 : 2);
      const bayType = bayTypes[typeIndex];
      insertBay.run(`${bayType.name}${i}号`, i, bayType.type, bayType.rate);
    }

    const equipments = [
      { name: '一号木杆', category: '木杆', brand: 'Titleist', specification: '9.5° S', total: 15, available: 15, deposit: 500 },
      { name: '三号木杆', category: '木杆', brand: 'Callaway', specification: '15° R', total: 12, available: 12, deposit: 400 },
      { name: '五号铁杆组', category: '铁杆', brand: 'TaylorMade', specification: '5-PW R', total: 10, available: 10, deposit: 800 },
      { name: '挖起杆', category: '短杆', brand: 'Titleist', specification: '56°', total: 8, available: 8, deposit: 300 },
      { name: '推杆', category: '推杆', brand: 'Odyssey', specification: '34英寸', total: 10, available: 10, deposit: 400 },
      { name: '高尔夫球', category: '配件', brand: 'Titleist', specification: 'Pro V1', total: 100, available: 100, deposit: 50 },
      { name: '球包', category: '配件', brand: 'Ping', specification: '标准', total: 5, available: 5, deposit: 200 },
      { name: '手套', category: '配件', brand: 'FootJoy', specification: '男士L', total: 20, available: 20, deposit: 50 },
      { name: '教练专用铁杆', category: '教学器材', brand: 'TaylorMade', specification: '教学专用', total: 6, available: 6, deposit: 0 },
      { name: '挥杆练习器', category: '教学器材', brand: 'SKLZ', specification: '标准版', total: 4, available: 4, deposit: 0 }
    ];

    const insertEquipment = db.prepare(`
      INSERT INTO equipments (name, category, brand, specification, total_quantity, available_quantity, deposit_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    equipments.forEach(eq => {
      insertEquipment.run(eq.name, eq.category, eq.brand, eq.specification, eq.total, eq.available, eq.deposit);
    });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const insertTx = db.prepare(`
      INSERT INTO wallet_transactions (wallet_id, member_id, type, amount, principal_amount, gift_amount, source, source_id, operator_id, remark, reconciliation_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'matched')
    `);

    const insertBooking = db.prepare(`
      INSERT INTO bookings (member_id, bay_id, booking_date, start_time, end_time, duration_minutes, total_amount, status, checkin_operator_id, checkin_at, complete_operator_id, completed_at, created_by, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4, ?)
    `);

    const insertEquipRecord = db.prepare(`
      INSERT INTO equipment_records (equipment_id, member_id, booking_id, borrow_operator_id, borrow_at, return_operator_id, return_at, return_status, damage_remark, damage_fee)
      VALUES (?, ?, ?, 4, ?, 4, ?, ?, ?, ?)
    `);

    for (let i = 0; i < 5; i++) {
      const memberId = i + 1;
      const walletId = memberId;
      const amount = 1000 * (i + 1);
      const giftAmount = amount * 0.1;

      insertTx.run(
        walletId,
        memberId,
        'recharge',
        amount + giftAmount,
        amount,
        giftAmount,
        'recharge',
        4,
        `会员充值${amount}元，赠送${giftAmount}元`
      );
    }

    const normalBookings = [
      { memberId: 1, bayId: 20, date: formatDate(twoDaysAgo), start: '09:00', end: '11:00', duration: 120, amount: 400, checkin: '09:05', complete: '11:00', status: 'completed' },
      { memberId: 2, bayId: 1, date: formatDate(twoDaysAgo), start: '10:00', end: '12:00', duration: 120, amount: 160, checkin: '10:02', complete: '11:55', status: 'completed' },
      { memberId: 3, bayId: 21, date: formatDate(twoDaysAgo), start: '14:00', end: '16:30', duration: 150, amount: 375, checkin: '14:00', complete: '16:25', status: 'completed' },
      { memberId: 1, bayId: 20, date: formatDate(yesterday), start: '08:30', end: '10:30', duration: 120, amount: 400, checkin: '08:35', complete: '10:25', status: 'completed' },
      { memberId: 4, bayId: 5, date: formatDate(yesterday), start: '11:00', end: '13:00', duration: 120, amount: 160, checkin: '11:05', complete: '12:55', status: 'completed' },
      { memberId: 5, bayId: 22, date: formatDate(yesterday), start: '15:00', end: '17:00', duration: 120, amount: 300, checkin: '15:10', complete: '16:50', status: 'completed' },
      { memberId: 10, bayId: 23, date: formatDate(yesterday), start: '16:00', end: '18:00', duration: 120, amount: 400, checkin: '16:05', complete: '18:00', status: 'completed' },
      { memberId: 2, bayId: 2, date: formatDate(today), start: '09:00', end: '11:00', duration: 120, amount: 160, checkin: '09:00', complete: '10:55', status: 'completed' },
      { memberId: 6, bayId: 10, date: formatDate(today), start: '10:00', end: '11:30', duration: 90, amount: 120, checkin: '10:05', complete: null, status: 'checked_in' },
      { memberId: 7, bayId: 15, date: formatDate(today), start: '14:00', end: '15:30', duration: 90, amount: 120, checkin: null, complete: null, status: 'booked' }
    ];

    normalBookings.forEach((booking, index) => {
      const result = insertBooking.run(
        booking.memberId,
        booking.bayId,
        booking.date,
        booking.start,
        booking.end,
        booking.duration,
        booking.amount,
        booking.status,
        booking.checkin ? 4 : null,
        booking.checkin ? `${booking.date} ${booking.checkin}` : null,
        booking.complete ? 4 : null,
        booking.complete ? `${booking.date} ${booking.complete}` : null,
        index < 8 ? `正常消费，${booking.duration / 60}小时` : null
      );

      const bookingId = result.lastInsertRowid as number;

      if (index < 8 && booking.memberId) {
        insertTx.run(
          booking.memberId,
          booking.memberId,
          'consume',
          booking.amount,
          booking.amount * 0.9,
          booking.amount * 0.1,
          'booking',
          bookingId,
          4,
          `球道消费 - ${booking.duration / 60}小时`
        );
      }

      if (index === 0) {
        insertEquipRecord.run(
          1,
          booking.memberId,
          bookingId,
          `${booking.date} ${booking.checkin}`,
          `${booking.date} ${booking.complete}`,
          'normal',
          null,
          0
        );
      }

      if (index === 3) {
        insertEquipRecord.run(
          3,
          booking.memberId,
          bookingId,
          `${booking.date} ${booking.checkin}`,
          `${booking.date} ${booking.complete}`,
          'normal',
          null,
          0
        );
      }
    });

    const insertBookingCustom = db.prepare(`
      INSERT INTO bookings (member_id, bay_id, booking_date, start_time, end_time, duration_minutes, total_amount, status, checkin_operator_id, checkin_at, complete_operator_id, completed_at, created_by, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTxCustom = db.prepare(`
      INSERT INTO wallet_transactions (wallet_id, member_id, type, amount, principal_amount, gift_amount, source, source_id, operator_id, remark, reconciliation_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertEquipRecordCustom = db.prepare(`
      INSERT INTO equipment_records (equipment_id, member_id, booking_id, borrow_operator_id, borrow_at, return_operator_id, return_at, return_status, damage_remark, damage_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const disputeBooking = insertBookingCustom.run(
      8, 3, formatDate(yesterday), '14:00', '15:00', 60, 80,
      'completed', 4, `${formatDate(yesterday)} 14:05`, 4, `${formatDate(yesterday)} 14:55`, 4, null
    );
    const disputeBookingId = disputeBooking.lastInsertRowid as number;

    const disputeTx = insertTxCustom.run(
      8, 8, 'consume', 160, 144, 16, 'booking', disputeBookingId, 4,
      '球道消费 - 2小时（实际仅1小时，金额有误）', 'mismatched'
    );
    const disputeTxId = disputeTx.lastInsertRowid as number;

    insertBookingCustom.run(
      8, 7, formatDate(yesterday), '16:00', '18:00', 120, 160,
      'no_show', null, null, null, null, 4, '预约未到场'
    );

    insertTxCustom.run(
      4, 4, 'consume', 120, 108, 12, 'manual', null, 4,
      '手动扣费（金额存疑）', 'mismatched'
    );

    insertTxCustom.run(
      3, 3, 'refund', 200, 180, 20, 'adjustment', null, 4,
      '退款 - 预约时间冲突补偿', 'matched'
    );

    const fengBooking = insertBookingCustom.run(
      9, 6, formatDate(yesterday), '10:00', '12:00', 120, 160,
      'completed', 4, `${formatDate(yesterday)} 10:05`, 4, `${formatDate(yesterday)} 11:55`, 4, null
    );
    const fengBookingId = fengBooking.lastInsertRowid as number;

    insertTxCustom.run(
      9, 9, 'consume', 160, 144, 16, 'booking', fengBookingId, 4,
      '球道消费 - 2小时', 'matched'
    );

    insertEquipRecordCustom.run(
      1, 9, fengBookingId, 4,
      `${formatDate(yesterday)} 10:05`, 4,
      `${formatDate(yesterday)} 11:55`,
      'damaged', '杆头有明显划痕，疑似碰撞造成', 200
    );

    const damageTx = insertTxCustom.run(
      9, 9, 'consume', 200, 200, 0, 'equipment', null, 4,
      '器材损坏赔偿 - 一号木杆杆头划痕', 'pending'
    );
    const damageTxId = damageTx.lastInsertRowid as number;

    insertEquipRecordCustom.run(
      2, 6, 9, 4,
      `${formatDate(today)} 10:05`,
      null, null, null, null, 0
    );

    const insertException = db.prepare(`
      INSERT INTO exceptions (member_id, type, title, description, evidence_screenshot, related_transaction_id, related_booking_id, status, created_by, handled_by, handled_at, handling_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertException.run(
      8,
      'billing_dispute',
      '储值扣减金额异常',
      '会员郑小刚反映昨日打球扣减金额与实际消费不符，系统扣减160元，但实际只打了1小时应扣80元。',
      '/evidence/dispute_001.jpg',
      disputeTxId,
      disputeBookingId,
      'processing',
      4,
      1,
      null,
      null
    );

    insertException.run(
      9,
      'equipment_damage',
      '归还球杆发现损坏',
      '会员冯雅婷归还一号木杆时发现杆头有划痕，疑似使用中碰撞造成。',
      '/evidence/damage_001.jpg',
      damageTxId,
      fengBookingId,
      'pending',
      4,
      null,
      null,
      null
    );

    insertException.run(
      5,
      'booking_error',
      '预约时间冲突',
      '会员孙晓峰反映15:00的球道被安排给了其他客人，导致等待30分钟。',
      null,
      null,
      6,
      'resolved',
      4,
      1,
      formatDate(yesterday) + ' 18:30:00',
      '已核实为前台操作失误，赠送会员200元储值作为补偿，已到账。'
    );

    insertException.run(
      7,
      'service_complaint',
      '前台服务态度差',
      '会员吴大海反映前台人员态度冷淡，长时间无人接待，等待超过20分钟才办理入场手续。',
      null,
      null,
      10,
      'processing',
      4,
      null,
      null,
      null
    );

    const insertReconciliation = db.prepare(`
      INSERT INTO reconciliations (reconciliation_date, total_recharge, total_consume, total_cash, difference, status, reviewed_by, reviewed_at, remark)
      VALUES (?, ?, ?, ?, 0, 'approved', 1, ?, ?)
    `);

    insertReconciliation.run(
      formatDate(twoDaysAgo),
      15000,
      935,
      14065,
      formatDate(yesterday) + ' 10:00:00',
      '对账无误，已确认'
    );

    insertReconciliation.run(
      formatDate(yesterday),
      0,
      1260,
      -1260,
      null,
      '待审核'
    );

    const insertAuditLog = db.prepare(`
      INSERT INTO audit_logs (user_id, module, action, target_type, target_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAuditLog.run(4, 'wallet', 'create', 'transaction', 1, null, '{"type":"recharge","amount":1000}', '192.168.1.100', 'Mozilla/5.0');
    insertAuditLog.run(4, 'booking', 'update', 'booking', 1, '{"status":"booked"}', '{"status":"checked_in"}', '192.168.1.100', 'Mozilla/5.0');
    insertAuditLog.run(4, 'booking', 'update', 'booking', 1, '{"status":"checked_in"}', '{"status":"completed"}', '192.168.1.100', 'Mozilla/5.0');
    insertAuditLog.run(4, 'equipment', 'create', 'equipment_record', 1, null, '{"action":"borrow","equipment_id":1}', '192.168.1.100', 'Mozilla/5.0');
    insertAuditLog.run(4, 'equipment', 'update', 'equipment_record', 1, '{"return_status":null}', '{"return_status":"normal"}', '192.168.1.100', 'Mozilla/5.0');

    const insertHoliday = db.prepare(`
      INSERT OR IGNORE INTO holidays (holiday_date, name, type, coefficient)
      VALUES (?, ?, ?, ?)
    `);

    insertHoliday.run('2026-01-01', '元旦', 'public', 1.5);
    insertHoliday.run('2026-01-29', '春节', 'public', 1.5);
    insertHoliday.run('2026-01-30', '春节', 'public', 1.5);
    insertHoliday.run('2026-01-31', '春节', 'public', 1.5);
    insertHoliday.run('2026-02-01', '春节', 'public', 1.5);
    insertHoliday.run('2026-02-02', '春节', 'public', 1.5);
    insertHoliday.run('2026-02-03', '春节', 'public', 1.5);
    insertHoliday.run('2026-04-04', '清明节', 'public', 1.5);
    insertHoliday.run('2026-04-05', '清明节', 'public', 1.5);
    insertHoliday.run('2026-05-01', '劳动节', 'public', 1.5);
    insertHoliday.run('2026-05-02', '劳动节', 'public', 1.5);
    insertHoliday.run('2026-05-03', '劳动节', 'public', 1.5);
    insertHoliday.run('2026-05-30', '端午节', 'public', 1.5);
    insertHoliday.run('2026-05-31', '端午节', 'public', 1.5);
    insertHoliday.run('2026-10-01', '国庆节', 'public', 1.5);
    insertHoliday.run('2026-10-02', '国庆节', 'public', 1.5);
    insertHoliday.run('2026-10-03', '国庆节', 'public', 1.5);
    insertHoliday.run('2026-10-04', '国庆节', 'public', 1.5);
    insertHoliday.run('2026-10-05', '国庆节', 'public', 1.5);
    insertHoliday.run('2026-10-06', '国庆节', 'public', 1.5);
    insertHoliday.run('2026-10-07', '国庆节', 'public', 1.5);
    insertHoliday.run('2026-06-19', '场地维护日', 'special', 2.0);

    console.log('✅ 样例数据初始化完成');
    console.log('');
    console.log('📋 测试账号（密码均为 123456）：');
    console.log('   场馆经理：manager / 123456');
    console.log('   教练主管：coach1 / 123456 或 coach2 / 123456');
    console.log('   前台：reception1 / 123456 或 reception2 / 123456');
    console.log('');
    console.log('📊 已创建数据：');
    console.log('   • 5个系统用户（3种角色）');
    console.log('   • 10个会员（4个等级）');
    console.log('   • 24条球道（普通/VIP/教练）');
    console.log('   • 10种器材（共190件）');
    console.log('   • 5笔充值流水 + 11笔消费流水 + 1笔退款流水');
    console.log('   • 13条预约记录（含未到场、使用中、no_show状态）');
    console.log('   • 4条器材借还记录（含损坏、未归还）');
    console.log('   • 4个异常工单（处理中/待处理/已解决）');
    console.log('   • 2份对账单（已审核/待审核）');
    console.log('   • 5条审计日志');
    console.log('');
    console.log('🔍 测试场景：');
    console.log('   ✅ 正常流：会员到店→查余额→选球道→扣储值→借器材→归还→对账');
    console.log('   ❌ 问题流1：消费扣减金额异常投诉 - 郑小刚（预约1小时扣费2小时，reconciliation_status=mismatched）');
    console.log('   ❌ 问题流2：器材归还损坏 - 冯雅婷（return_status=damaged, damage_fee=200）');
    console.log('   ❌ 问题流3：预约时间冲突 - 孙晓峰（已解决）');
    console.log('   ❌ 问题流4：预约未到场 - 郑小刚（booking status=no_show）');
    console.log('   ❌ 问题流5：服务投诉 - 吴大海（service_complaint）');
    console.log('   ❌ 问题流6：退款处理 - 王丽华（refund交易）');
    console.log('   ❌ 问题流7：手动扣费金额存疑 - 赵文博（reconciliation_status=mismatched）');
  });

  tx();
}
