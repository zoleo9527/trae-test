import dayjs from 'dayjs'

export async function seedDatabase() {
  const now = Date.now()
  const today = dayjs()
  
  const existing = await window.db.query('SELECT COUNT(*) as cnt FROM lockers')
  if (existing[0].cnt > 0) return

  const statements: { sql: string; params?: any[] }[] = []

  const zones = ['A', 'B', 'C', 'D']
  const occupiedLockerIds = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 18, 20, 22, 25, 28, 30, 32, 35, 40, 42, 45]
  const maintenanceLockerIds = [7, 15, 24, 38, 50]
  const damagedLockerIds = [9, 33]
  const lockers: any[] = []
  let lockerId = 1
  zones.forEach(zone => {
    for (let i = 1; i <= 15; i++) {
      const lockerNo = `${zone}${String(i).padStart(2, '0')}`
      let status = 'available'
      if (occupiedLockerIds.includes(lockerId)) status = 'occupied'
      else if (maintenanceLockerIds.includes(lockerId)) status = 'maintenance'
      else if (damagedLockerIds.includes(lockerId)) status = 'damaged'
      
      lockers.push({ id: lockerId, locker_no: lockerNo, zone, status })
      statements.push({
        sql: 'INSERT INTO lockers (id, locker_no, zone, status, created_at) VALUES (?, ?, ?, ?, ?)',
        params: [lockerId, lockerNo, zone, status, now]
      })
      lockerId++
    }
  })

  const members = [
    { id: 1, member_no: 'M001', name: '陈先生', phone: '13800138001', balance: 2580.50, status: 'active' },
    { id: 2, member_no: 'M002', name: '李女士', phone: '13800138002', balance: 1200.00, status: 'active' },
    { id: 3, member_no: 'M003', name: '王小朋友', phone: '13800138003', balance: 3500.00, status: 'active' },
    { id: 4, member_no: 'M004', name: '赵先生', phone: '13800138004', balance: 0.00, status: 'active' },
    { id: 5, member_no: 'M005', name: '孙女士', phone: '13800138005', balance: 890.50, status: 'frozen' },
    { id: 6, member_no: 'M006', name: '周同学', phone: '13800138006', balance: 1560.00, status: 'active' },
    { id: 7, member_no: 'M007', name: '吴先生', phone: '13800138007', balance: 4200.00, status: 'active' },
    { id: 8, member_no: 'M008', name: '郑女士', phone: '13800138008', balance: 750.00, status: 'active' }
  ]
  members.forEach(m => {
    statements.push({
      sql: 'INSERT INTO members (id, member_no, name, phone, balance, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params: [m.id, m.member_no, m.name, m.phone, m.balance, m.status, now]
    })
  })

  const coaches = [
    { id: 1, name: '张教练', phone: '13900139001', specialty: '自由泳/蛙泳', status: 'active' },
    { id: 2, name: '刘教练', phone: '13900139002', specialty: '蝶泳/仰泳', status: 'active' },
    { id: 3, name: '黄教练', phone: '13900139003', specialty: '少儿启蒙', status: 'active' },
    { id: 4, name: '林教练', phone: '13900139004', specialty: '竞技训练', status: 'active' }
  ]
  coaches.forEach(c => {
    statements.push({
      sql: 'INSERT INTO coaches (id, name, phone, specialty, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      params: [c.id, c.name, c.phone, c.specialty, c.status, now]
    })
  })

  const courses = [
    { id: 1, name: '成人蛙泳入门班', coach_id: 1, start: today.hour(9).minute(0), end: today.hour(10).minute(0), capacity: 8, enrolled: 6 },
    { id: 2, name: '少儿游泳启蒙', coach_id: 3, start: today.hour(10).minute(30), end: today.hour(11).minute(30), capacity: 6, enrolled: 5 },
    { id: 3, name: '自由泳提高班', coach_id: 2, start: today.hour(14).minute(0), end: today.hour(15).minute(30), capacity: 6, enrolled: 4 },
    { id: 4, name: '水中健身课', coach_id: 4, start: today.hour(16).minute(0), end: today.hour(17).minute(0), capacity: 10, enrolled: 8 },
    { id: 5, name: '成人蛙泳入门班', coach_id: 1, start: today.add(1, 'day').hour(9).minute(0), end: today.add(1, 'day').hour(10).minute(0), capacity: 8, enrolled: 3 },
    { id: 6, name: '竞技训练班', coach_id: 4, start: today.add(1, 'day').hour(15).minute(0), end: today.add(1, 'day').hour(17).minute(0), capacity: 4, enrolled: 4 },
    { id: 7, name: '少儿游泳启蒙', coach_id: 3, start: today.add(2, 'day').hour(10).minute(30), end: today.add(2, 'day').hour(11).minute(30), capacity: 6, enrolled: 2 },
    { id: 8, name: '仰泳专项课', coach_id: 2, start: today.add(3, 'day').hour(14).minute(0), end: today.add(3, 'day').hour(15).minute(30), capacity: 6, enrolled: 5 }
  ]
  courses.forEach(c => {
    statements.push({
      sql: 'INSERT INTO courses (id, name, coach_id, start_time, end_time, capacity, enrolled, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      params: [c.id, c.name, c.coach_id, c.start.valueOf(), c.end.valueOf(), c.capacity, c.enrolled, 'scheduled', now]
    })
  })

  const occupiedLockers = lockers.filter(l => l.status === 'occupied')
  const assignments = [
    { locker_id: occupiedLockers[0]?.id || 1, member_id: 1, assign_type: 'member', operator_id: 3, hoursAgo: 2 },
    { locker_id: occupiedLockers[1]?.id || 2, member_id: 2, assign_type: 'member', operator_id: 3, hoursAgo: 3 },
    { locker_id: occupiedLockers[2]?.id || 3, guest_name: '临时访客A', assign_type: 'guest', operator_id: 3, hoursAgo: 1 },
    { locker_id: occupiedLockers[3]?.id || 4, member_id: 3, assign_type: 'member', operator_id: 3, hoursAgo: 4 },
    { locker_id: occupiedLockers[4]?.id || 5, member_id: 6, assign_type: 'member', operator_id: 3, hoursAgo: 0.5 },
    { locker_id: occupiedLockers[5]?.id || 6, guest_name: '体验客户', assign_type: 'temporary', operator_id: 3, hoursAgo: 1.5 }
  ]
  assignments.forEach((a, idx) => {
    const assignedAt = today.subtract(a.hoursAgo, 'hour').valueOf()
    statements.push({
      sql: 'INSERT INTO locker_assignments (locker_id, member_id, guest_name, assign_type, assigned_at, operator_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      params: [a.locker_id, a.member_id || null, a.guest_name || null, a.assign_type, assignedAt, a.operator_id, 'active', now]
    })
  })

  const transactions = [
    { member_id: 1, type: 'recharge', amount: 2000, balance_after: 2580.50, hoursAgo: 72, operator_id: 3, note: '年卡充值' },
    { member_id: 1, type: 'consume', amount: -200, balance_after: 580.50, hoursAgo: 24, operator_id: 3, note: '课程消费-蛙泳班' },
    { member_id: 3, type: 'recharge', amount: 3000, balance_after: 3500.00, hoursAgo: 48, operator_id: 3, note: '少儿培训充值' },
    { member_id: 6, type: 'recharge', amount: 1000, balance_after: 1560.00, hoursAgo: 12, operator_id: 3, note: '充值' },
    { member_id: 7, type: 'recharge', amount: 5000, balance_after: 4200.00, hoursAgo: 96, operator_id: 3, note: 'VIP会员充值' },
    { member_id: 7, type: 'consume', amount: -800, balance_after: -800, hoursAgo: 50, operator_id: 3, note: '私教课程' },
    { member_id: 8, type: 'recharge', amount: 1000, balance_after: 750.00, hoursAgo: 36, operator_id: 3, note: '充值' },
    { member_id: 8, type: 'consume', amount: -250, balance_after: -250, hoursAgo: 10, operator_id: 3, note: '门票消费' }
  ]
  transactions.forEach((t, idx) => {
    const createdAt = today.subtract(t.hoursAgo, 'hour').valueOf()
    statements.push({
      sql: 'INSERT INTO transactions (member_id, type, amount, balance_after, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params: [t.member_id, t.type, t.amount, t.balance_after, t.operator_id, t.note, createdAt]
    })
  })

  const appeals = [
    {
      id: 1, appeal_no: 'AP20260524001', type: 'locker_issue',
      title: '储物柜A03钥匙无法打开',
      description: '今天上午9点到店，使用储物柜A03时发现钥匙插入后无法转动，已尝试多次均失败。柜内有个人物品需要取出，希望尽快处理。',
      related_locker_id: 3, status: 'investigating', priority: 'high',
      reporter_id: 3, assignee_id: 1,
      hoursAgo: 8,
      timeline: [
        { action: '创建申诉', note: '储物柜A03钥匙无法打开，柜内有私人物品', hoursAgo: 8, actor: 3 },
        { action: '开始调查', note: '已联系维修人员到场检查', hoursAgo: 7, actor: 1 },
        { action: '添加备注', note: '维修人员反馈锁芯损坏，需要更换', hoursAgo: 6, actor: 1 }
      ]
    },
    {
      id: 2, appeal_no: 'AP20260524002', type: 'course_leave',
      title: '请假申请-5月26日自由泳班',
      description: '因本周出差，无法参加5月26日下午2点的自由泳提高班，申请请假，希望课时可以延后或退款。',
      related_course_id: 3, status: 'pending', priority: 'normal',
      reporter_id: 3, assignee_id: 2,
      hoursAgo: 12,
      timeline: [
        { action: '创建申诉', note: '因出差无法参加5月26日课程，申请请假', hoursAgo: 12, actor: 3 }
      ]
    },
    {
      id: 3, appeal_no: 'AP20260523001', type: 'billing_error',
      title: '储值扣款金额有误',
      description: '昨天消费记录显示扣款250元，但我只参加了一个150元的课程，多扣了100元。请核实并退还差额。',
      related_transaction_id: 8, status: 'resolved', priority: 'high',
      reporter_id: 3, assignee_id: 1,
      hoursAgo: 20,
      timeline: [
        { action: '创建申诉', note: '质疑5月25日消费扣款金额', hoursAgo: 20, actor: 3 },
        { action: '开始调查', note: '正在核对消费记录和课程签到表', hoursAgo: 18, actor: 1 },
        { action: '标记已解决', note: '经核实确为系统多扣100元，已退还至会员账户', hoursAgo: 10, actor: 1 }
      ]
    },
    {
      id: 4, appeal_no: 'AP20260523002', type: 'water_quality',
      title: '儿童池水质问题',
      description: '下午4点左右在儿童池游泳时发现水质浑浊，有异味。孩子皮肤出现轻微发红，希望能重视水质检测和处理。',
      status: 'escalated', priority: 'urgent',
      reporter_id: 2, assignee_id: 1,
      hoursAgo: 26,
      timeline: [
        { action: '创建申诉', note: '儿童池水质浑浊有异味，孩子皮肤发红', hoursAgo: 26, actor: 2 },
        { action: '开始调查', note: '已安排水质检测', hoursAgo: 24, actor: 2 },
        { action: '升级申诉', note: '检测结果显示余氯超标，需要紧急处理', hoursAgo: 20, actor: 1 }
      ]
    },
    {
      id: 5, appeal_no: 'AP20260522001', type: 'locker_issue',
      title: '储物柜B07内物品丢失',
      description: '今日游泳结束后打开储物柜B07，发现钱包内现金丢失约500元，其他物品完好。 locker是完好锁上的，怀疑是万能钥匙被盗用。',
      related_locker_id: 22, status: 'investigating', priority: 'urgent',
      reporter_id: 3, assignee_id: 1,
      hoursAgo: 36,
      timeline: [
        { action: '创建申诉', note: '储物柜B07内现金丢失约500元', hoursAgo: 36, actor: 3 },
        { action: '开始调查', note: '已调取监控录像，正在排查', hoursAgo: 34, actor: 1 },
        { action: '添加备注', note: '监控显示期间无异常人员接近该储物柜，已建议报警', hoursAgo: 30, actor: 1 }
      ]
    },
    {
      id: 6, appeal_no: 'AP20260521001', type: 'other',
      title: '淋浴区热水供应不足',
      description: '最近一周晚上7点到8点高峰期，淋浴区热水经常断断续续，水温不稳定，影响使用体验。',
      status: 'resolved', priority: 'normal',
      reporter_id: 2, assignee_id: 1,
      hoursAgo: 60,
      timeline: [
        { action: '创建申诉', note: '淋浴区热水供应不稳定', hoursAgo: 60, actor: 2 },
        { action: '开始调查', note: '已联系设备供应商检查', hoursAgo: 56, actor: 1 },
        { action: '标记已解决', note: '热水器故障已修复，热水供应恢复正常', hoursAgo: 40, actor: 1 }
      ]
    },
    {
      id: 7, appeal_no: 'AP20260520001', type: 'course_leave',
      title: '课程时间冲突请求调课',
      description: '原报名周六上午10点的少儿启蒙班，但学校新安排了周末兴趣班时间冲突，希望能调到周日同时段。',
      related_course_id: 2, status: 'resolved', priority: 'low',
      reporter_id: 3, assignee_id: 2,
      hoursAgo: 80,
      timeline: [
        { action: '创建申诉', note: '请求将周六课程调到周日', hoursAgo: 80, actor: 3 },
        { action: '标记已解决', note: '已调整至周日同时段，请注意查收新课表', hoursAgo: 75, actor: 2 }
      ]
    }
  ]

  appeals.forEach(a => {
    const createdAt = today.subtract(a.hoursAgo, 'hour').valueOf()
    statements.push({
      sql: 'INSERT INTO appeals (id, appeal_no, type, title, description, related_locker_id, related_course_id, related_transaction_id, reporter_id, assignee_id, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      params: [a.id, a.appeal_no, a.type, a.title, a.description, a.related_locker_id || null, a.related_course_id || null, a.related_transaction_id || null, a.reporter_id, a.assignee_id, a.status, a.priority, createdAt, createdAt]
    })

    a.timeline.forEach(tl => {
      const tlTime = today.subtract(tl.hoursAgo, 'hour').valueOf()
      statements.push({
        sql: 'INSERT INTO appeal_timeline (appeal_id, actor_id, action, note, created_at) VALUES (?, ?, ?, ?, ?)',
        params: [a.id, tl.actor, tl.action, tl.note, tlTime]
      })
    })
  })

  const patrolPhotos = [
    { id: 1, location: '儿童池', issue_type: 'water_quality', description: '水质轻微浑浊，需要增加循环过滤时间', status: 'resolved', reporter_id: 2, hoursAgo: 48 },
    { id: 2, location: '深水区跳板', issue_type: 'safety', description: '跳板边缘有轻微磨损，防滑层脱落', status: 'processing', reporter_id: 2, hoursAgo: 24 },
    { id: 3, location: '更衣室淋浴区', issue_type: 'equipment', description: '3号淋浴龙头出水小，可能堵塞', status: 'reported', reporter_id: 2, hoursAgo: 12 },
    { id: 4, location: '储物柜B区', issue_type: 'cleanliness', description: '地面有积水，未及时清理', status: 'resolved', reporter_id: 2, hoursAgo: 36 },
    { id: 5, location: '泳池边休息区', issue_type: 'cleanliness', description: '垃圾桶已满，有异味', status: 'reported', reporter_id: 2, hoursAgo: 6 },
    { id: 6, location: '机房', issue_type: 'equipment', description: '除湿机运行噪音异常', status: 'processing', reporter_id: 2, hoursAgo: 72 }
  ]
  patrolPhotos.forEach(p => {
    const createdAt = today.subtract(p.hoursAgo, 'hour').valueOf()
    statements.push({
      sql: 'INSERT INTO patrol_photos (id, photo_path, location, issue_type, description, reporter_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      params: [p.id, `/photos/${p.id}.jpg`, p.location, p.issue_type, p.description, p.reporter_id, p.status, createdAt]
    })
  })

  await window.db.transaction(statements)
}
