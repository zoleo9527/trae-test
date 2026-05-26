const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const { db, initSchema } = require('../src/db')

const today = new Date()
function offsetDate(days) {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function offsetDateTime(days, hours = 0) {
  const d = new Date(today)
  d.setDate(d.getDate() + days)
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

function seed() {
  initSchema()
  db.pragma('foreign_keys = OFF')

  const orderTs = Date.now().toString().slice(-8)

  db.exec('DELETE FROM audit_logs')
  db.exec('DELETE FROM order_status_history')
  db.exec('DELETE FROM refunds')
  db.exec('DELETE FROM reworks')
  db.exec('DELETE FROM processing_records')
  db.exec('DELETE FROM lens_allocations')
  db.exec('DELETE FROM orders')
  db.exec('DELETE FROM optometry_records')
  db.exec('DELETE FROM appointments')
  db.exec('DELETE FROM customers')
  db.exec('DELETE FROM lens_sku')
  db.exec('DELETE FROM users')
  db.exec('DELETE FROM stores')

  const store1Id = uuidv4()
  const store2Id = uuidv4()
  db.prepare("INSERT INTO stores (id, name, address, phone) VALUES (?, ?, ?, ?)")
    .run(store1Id, '中心旗舰店', '市中心人民路128号', '021-12345678')
  db.prepare("INSERT INTO stores (id, name, address, phone) VALUES (?, ?, ?, ?)")
    .run(store2Id, '东区分店', '东区商业街56号', '021-87654321')

  const hashPwd = (pwd) => bcrypt.hashSync(pwd, 10)
  const users = [
    { username: 'admin', password: 'admin123', full_name: '系统管理员', role: 'admin', store_id: null },
    { username: 'manager1', password: 'manager123', full_name: '张店长', role: 'store_manager', store_id: store1Id },
    { username: 'manager2', password: 'manager123', full_name: '李店长', role: 'store_manager', store_id: store2Id },
    { username: 'optician1', password: 'optician123', full_name: '王验光师', role: 'optician', store_id: store1Id },
    { username: 'optician2', password: 'optician123', full_name: '赵验光师', role: 'optician', store_id: store2Id },
    { username: 'processor1', password: 'processor123', full_name: '刘加工师', role: 'processor', store_id: store1Id },
    { username: 'processor2', password: 'processor123', full_name: '陈加工师', role: 'processor', store_id: store2Id },
    { username: 'service1', password: 'service123', full_name: '孙客服', role: 'service', store_id: store1Id }
  ]

  const userMap = {}
  for (const u of users) {
    const id = uuidv4()
    db.prepare('INSERT INTO users (id, username, password_hash, full_name, role, store_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, u.username, hashPwd(u.password), u.full_name, u.role, u.store_id)
    userMap[u.username] = id
  }

  const lensSkus = [
    { sku_code: 'ESS-167-CLR', brand: '依视路', model: '钻晶1.67', sphere_range: '-8.00~+6.00', cylinder_range: '0~-4.00', stock: 50 },
    { sku_code: 'ESS-174-CLR', brand: '依视路', model: '钻晶1.74', sphere_range: '-10.00~+4.00', cylinder_range: '0~-3.00', stock: 30 },
    { sku_code: 'ZEI-167-BL', brand: '蔡司', model: '清锐1.67防蓝光', sphere_range: '-8.00~+4.00', cylinder_range: '0~-4.00', stock: 45 },
    { sku_code: 'ZEI-160-A', brand: '蔡司', model: 'A系列1.60', sphere_range: '-6.00~+4.00', cylinder_range: '0~-3.00', stock: 80 },
    { sku_code: 'HOK-167-P', brand: '豪雅', model: '优适1.67', sphere_range: '-8.00~+4.00', cylinder_range: '0~-4.00', stock: 0 },
    { sku_code: 'ESS-156-ADD', brand: '依视路', model: '万里路1.56', sphere_range: '-6.00~+3.00', add_power_range: '+1.00~+3.00', stock: 25 }
  ]

  const skuMap = {}
  for (const s of lensSkus) {
    const id = uuidv4()
    db.prepare(`INSERT INTO lens_sku (id, sku_code, brand, model, sphere_range, cylinder_range, add_power_range, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, s.sku_code, s.brand, s.model, s.sphere_range, s.cylinder_range, s.add_power_range || null, s.stock)
    skuMap[s.sku_code] = id
  }

  const customers = [
    { name: '陈小明', phone: '13800138001', gender: '男', age: 32, store_id: store1Id },
    { name: '李晓红', phone: '13800138002', gender: '女', age: 28, store_id: store1Id },
    { name: '王大伟', phone: '13800138003', gender: '男', age: 45, store_id: store1Id },
    { name: '赵丽丽', phone: '13800138004', gender: '女', age: 38, store_id: store2Id },
    { name: '周建军', phone: '13800138005', gender: '男', age: 52, store_id: store1Id },
    { name: '吴小芳', phone: '13800138006', gender: '女', age: 26, store_id: store2Id },
    { name: '郑海涛', phone: '13800138007', gender: '男', age: 35, store_id: store1Id },
    { name: '孙美玲', phone: '13800138008', gender: '女', age: 42, store_id: store2Id }
  ]

  const customerMap = {}
  for (const c of customers) {
    const id = uuidv4()
    db.prepare('INSERT INTO customers (id, name, phone, gender, age, store_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, c.name, c.phone, c.gender, c.age, c.store_id)
    customerMap[c.name] = id
  }

  const appointments = [
    { customer: '陈小明', store_id: store1Id, optician: 'optician1', date: offsetDate(0), time: '09:00', status: 'completed', priority: 'normal' },
    { customer: '李晓红', store_id: store1Id, optician: 'optician1', date: offsetDate(0), time: '10:00', status: 'in_progress', priority: 'urgent' },
    { customer: '王大伟', store_id: store1Id, optician: 'optician1', date: offsetDate(0), time: '14:00', status: 'confirmed', priority: 'normal' },
    { customer: '赵丽丽', store_id: store2Id, optician: 'optician2', date: offsetDate(0), time: '11:00', status: 'confirmed', priority: 'vip' },
    { customer: '周建军', store_id: store1Id, optician: 'optician1', date: offsetDate(-2), time: '09:30', status: 'overdue', priority: 'normal' },
    { customer: '吴小芳', store_id: store2Id, optician: 'optician2', date: offsetDate(1), time: '15:00', status: 'pending', priority: 'normal' },
    { customer: '郑海涛', store_id: store1Id, optician: null, date: offsetDate(0), time: '16:00', status: 'pending', priority: 'normal' },
    { customer: '孙美玲', store_id: store2Id, optician: 'optician2', date: offsetDate(-1), time: '10:00', status: 'completed', priority: 'normal' }
  ]

  const aptMap = {}
  for (const a of appointments) {
    const id = uuidv4()
    const no = 'APT' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    db.prepare(`INSERT INTO appointments (id, appointment_no, customer_id, store_id, optician_id, scheduled_date, scheduled_time, status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, no, customerMap[a.customer], a.store_id, a.optician ? userMap[a.optician] : null, a.date, a.time, a.status, a.priority)
    aptMap[a.customer] = id
  }

  const optometryRecords = [
    {
      appointment: '陈小明', customer: '陈小明', store_id: store1Id, optician: 'optician1',
      sphere_od: -3.50, sphere_os: -3.25, cylinder_od: -0.75, cylinder_os: -0.50,
      axis_od: 90, axis_os: 180, pd: 63,
      frame_brand: '雷朋', frame_model: 'RB7180', frame_color: '黑色',
      lens_sku_id: skuMap['ZEI-167-BL'], lens_brand: '蔡司', lens_model: '清锐1.67防蓝光',
      coating: '防蓝光', remarks: '客户对清晰度要求高'
    },
    {
      appointment: '孙美玲', customer: '孙美玲', store_id: store2Id, optician: 'optician2',
      sphere_od: -5.00, sphere_os: -4.75, cylinder_od: -1.00, cylinder_os: -0.75,
      axis_od: 45, axis_os: 135, pd: 60,
      frame_brand: '暴龙', frame_model: 'BJ6036', frame_color: '金色',
      lens_sku_id: skuMap['ESS-167-CLR'], lens_brand: '依视路', lens_model: '钻晶1.67',
      coating: '防紫外线', remarks: '高度近视，需要薄镜片'
    }
  ]

  for (const r of optometryRecords) {
    const id = uuidv4()
    db.prepare(`INSERT INTO optometry_records (id, appointment_id, customer_id, store_id, optician_id,
      sphere_od, sphere_os, cylinder_od, cylinder_os, axis_od, axis_os, pd,
      frame_brand, frame_model, frame_color, lens_sku_id, lens_brand, lens_model, coating, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, aptMap[r.appointment], customerMap[r.customer], r.store_id, userMap[r.optician],
        r.sphere_od, r.sphere_os, r.cylinder_od, r.cylinder_os, r.axis_od, r.axis_os, r.pd,
        r.frame_brand, r.frame_model, r.frame_color, r.lens_sku_id, r.lens_brand, r.lens_model, r.coating, r.remarks)
  }

  const orders = [
    {
      order_no: 'ORD' + orderTs + '001',
      customer: '陈小明', store_id: store1Id, optician: 'optician1', processor: 'processor1',
      frame_brand: '雷朋', frame_model: 'RB7180', frame_color: '黑色', frame_price: 800,
      lens_sku_id: skuMap['ZEI-167-BL'], lens_brand: '蔡司', lens_model: '清锐1.67防蓝光', lens_coating: '防蓝光', lens_price: 2200,
      sphere_od: -3.50, sphere_os: -3.25, cylinder_od: -0.75, cylinder_os: -0.50, axis_od: 90, axis_os: 180, pd: 63,
      total_amount: 3000, paid_amount: 3000, payment_status: 'paid',
      status: 'delivered', priority: 'normal',
      expected_date: offsetDate(5),
      created_at: offsetDateTime(-7)
    },
    {
      order_no: 'ORD' + orderTs + '002',
      customer: '李晓红', store_id: store1Id, optician: 'optician1', processor: 'processor1',
      frame_brand: '木九十', frame_model: 'MJ102FE', frame_color: '玳瑁色', frame_price: 600,
      lens_sku_id: skuMap['ESS-174-CLR'], lens_brand: '依视路', lens_model: '钻晶1.74', lens_coating: '钻晶A4', lens_price: 3500,
      sphere_od: -6.00, sphere_os: -5.75, cylinder_od: -1.50, cylinder_os: -1.25, axis_od: 30, axis_os: 120, pd: 62,
      total_amount: 4100, paid_amount: 4100, payment_status: 'paid',
      status: 'processing', priority: 'urgent',
      expected_date: offsetDate(2),
      created_at: offsetDateTime(-3)
    },
    {
      order_no: 'ORD' + orderTs + '003',
      customer: '王大伟', store_id: store1Id, optician: 'optician1', processor: null,
      frame_brand: '雷朋', frame_model: 'RB6421', frame_color: '枪灰色', frame_price: 900,
      lens_sku_id: null, lens_brand: '依视路', lens_model: '钻晶1.67', lens_coating: '钻晶A4', lens_price: 2500,
      sphere_od: -2.00, sphere_os: -2.00, cylinder_od: 0, cylinder_os: 0, axis_od: null, axis_os: null, pd: 64,
      total_amount: 3400, paid_amount: 1000, payment_status: 'partial',
      status: 'lens_shortage', priority: 'normal',
      expected_date: offsetDate(7),
      created_at: offsetDateTime(-1)
    },
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '004',
      customer: '赵丽丽', store_id: store2Id, optician: 'optician2', processor: 'processor2',
      frame_brand: '古驰', frame_model: 'GG0396O', frame_color: '黑色', frame_price: 1800,
      lens_sku_id: skuMap['ESS-167-CLR'], lens_brand: '依视路', lens_model: '钻晶1.67', lens_coating: '钻晶A4', lens_price: 2200,
      sphere_od: -4.00, sphere_os: -4.00, cylinder_od: -0.50, cylinder_os: -0.50, axis_od: 90, axis_os: 90, pd: 61,
      total_amount: 4000, paid_amount: 4000, payment_status: 'paid',
      status: 'returned', priority: 'vip',
      expected_date: offsetDate(3),
      created_at: offsetDateTime(-5)
    },
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '005',
      customer: '周建军', store_id: store1Id, optician: 'optician1', processor: 'processor1',
      frame_brand: '夏蒙', frame_model: 'CH10925', frame_color: '黑色', frame_price: 1500,
      lens_sku_id: skuMap['ESS-156-ADD'], lens_brand: '依视路', lens_model: '万里路1.56', lens_coating: '钻晶A3', lens_price: 1800,
      sphere_od: -1.50, sphere_os: -1.50, cylinder_od: 0, cylinder_os: 0, pd: 62, add_power: 2.00,
      total_amount: 3300, paid_amount: 3300, payment_status: 'paid',
      status: 'quality_check', priority: 'normal',
      expected_date: offsetDate(1),
      created_at: offsetDateTime(-4)
    },
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '006',
      customer: '郑海涛', store_id: store1Id, optician: null, processor: null,
      frame_brand: null, frame_model: null, frame_color: null, frame_price: 0,
      lens_sku_id: null, lens_brand: null, lens_model: null, lens_coating: null, lens_price: 0,
      sphere_od: null, sphere_os: null, cylinder_od: null, cylinder_os: null, axis_od: null, axis_os: null, pd: null,
      total_amount: 0, paid_amount: 0, payment_status: 'unpaid',
      status: 'pending', priority: 'normal',
      created_at: offsetDateTime(0)
    },
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '007',
      customer: '孙美玲', store_id: store2Id, optician: 'optician2', processor: 'processor2',
      frame_brand: '暴龙', frame_model: 'BJ6036', frame_color: '金色', frame_price: 700,
      lens_sku_id: skuMap['HOK-167-P'], lens_brand: '豪雅', lens_model: '优适1.67', lens_coating: '常规', lens_price: 1800,
      sphere_od: -5.00, sphere_os: -4.75, cylinder_od: -1.00, cylinder_os: -0.75, axis_od: 45, axis_os: 135, pd: 60,
      total_amount: 2500, paid_amount: 2500, payment_status: 'paid',
      status: 'refunding', priority: 'normal',
      expected_date: offsetDate(0),
      created_at: offsetDateTime(-6)
    }
  ]

  const orderMap = {}
  for (const o of orders) {
    const id = uuidv4()
    db.prepare(`INSERT INTO orders (id, order_no, customer_id, store_id, optician_id, processor_id,
      frame_brand, frame_model, frame_color, frame_price,
      lens_sku_id, lens_brand, lens_model, lens_coating, lens_price,
      sphere_od, sphere_os, cylinder_od, cylinder_os, axis_od, axis_os, pd, add_power,
      total_amount, paid_amount, payment_status, status, priority, expected_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, o.order_no, customerMap[o.customer], o.store_id,
        o.optician ? userMap[o.optician] : null, o.processor ? userMap[o.processor] : null,
        o.frame_brand, o.frame_model, o.frame_color, o.frame_price,
        o.lens_sku_id, o.lens_brand, o.lens_model, o.lens_coating, o.lens_price,
        o.sphere_od, o.sphere_os, o.cylinder_od, o.cylinder_os, o.axis_od, o.axis_os, o.pd, o.add_power,
        o.total_amount, o.paid_amount, o.payment_status, o.status, o.priority, o.expected_date, o.created_at)
    orderMap[o.order_no] = id

    if (o.status !== 'pending') {
      db.prepare(`INSERT INTO order_status_history (id, order_id, old_status, new_status, changed_by, changed_at, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(uuidv4(), id, null, o.status, o.optician ? userMap[o.optician] : userMap['admin'], o.created_at, '订单创建')
    }
  }

  const reworks = [
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '004',
      reason: '客户反映瞳距测量不准，佩戴后头晕', rework_type: 'measurement', status: 'pending',
      requested_by: 'service1', source: 'customer_complaint',
      requested_at: offsetDateTime(-1)
    },
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '005',
      reason: '镜片边缘抛光不平整，需要返工', rework_type: 'quality', status: 'approved',
      requested_by: 'processor1', source: 'quality_check',
      requested_at: offsetDateTime(-2), approved_by: 'manager1', approved_at: offsetDateTime(-2)
    }
  ]

  for (const r of reworks) {
    const id = uuidv4()
    db.prepare(`INSERT INTO reworks (id, order_id, reason, rework_type, status, requested_by, requested_at, approved_by, approved_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, orderMap[r.order_no], r.reason, r.rework_type, r.status, userMap[r.requested_by], r.requested_at,
        r.approved_by ? userMap[r.approved_by] : null, r.approved_at || null, r.source)
  }

  const refunds = [
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '007',
      reason: '豪雅优适1.67镜片缺货，客户同意退款', amount: 2500,
      refund_method: '原路退回', status: 'pending',
      requested_by: 'service1', requested_at: offsetDateTime(-1, -2)
    }
  ]

  for (const rf of refunds) {
    const id = uuidv4()
    db.prepare(`INSERT INTO refunds (id, order_id, reason, amount, refund_method, status, requested_by, requested_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, orderMap[rf.order_no], rf.reason, rf.amount, rf.refund_method, rf.status, userMap[rf.requested_by], rf.requested_at)
  }

  const allocations = [
    {
      order_no: 'ORD' + orderTs + '002',
      lens_sku_id: skuMap['ESS-174-CLR'], quantity: 1,
      to_store_id: store1Id, status: 'allocated',
      allocated_by: 'manager1', allocated_at: offsetDateTime(-2)
    },
    {
      order_no: 'ORD' + orderTs + '003',
      lens_sku_id: skuMap['HOK-167-P'], quantity: 1,
      from_store_id: store2Id, to_store_id: store1Id, status: 'pending',
      allocated_by: 'manager1', allocated_at: offsetDateTime(-1),
      notes: '东区分店调拨，等待发货'
    }
  ]

  for (const al of allocations) {
    const id = uuidv4()
    db.prepare(`INSERT INTO lens_allocations (id, order_id, lens_sku_id, quantity, from_store_id, to_store_id, status, allocated_by, allocated_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, orderMap[al.order_no], al.lens_sku_id, al.quantity, al.from_store_id || null, al.to_store_id,
        al.status, userMap[al.allocated_by], al.allocated_at, al.notes || null)
  }

  const processingRecords = [
    {
      order_no: 'ORD' + orderTs + '002',
      processor: 'processor1', processing_type: 'standard', status: 'in_progress',
      started_at: offsetDateTime(-1),
      remarks: '加急单，优先处理'
    },
    {
      order_no: 'ORD' + orderTs + '001',
      processor: 'processor1', processing_type: 'standard', status: 'completed',
      started_at: offsetDateTime(-6), completed_at: offsetDateTime(-4),
      quality_check_by: 'manager1', quality_check_result: 'pass', quality_check_notes: '检验合格'
    },
    {
      order_no: 'ORD' + Date.now().toString().slice(-8) + '005',
      processor: 'processor1', processing_type: 'standard', status: 'completed',
      started_at: offsetDateTime(-3), completed_at: offsetDateTime(-1),
      quality_check_by: 'manager1', quality_check_result: 'fail', quality_check_notes: '抛光不平整',
      defects: '边缘抛光不平整'
    }
  ]

  for (const pr of processingRecords) {
    const id = uuidv4()
    db.prepare(`INSERT INTO processing_records (id, order_id, processor_id, processing_type, status, started_at, completed_at,
      quality_check_by, quality_check_result, quality_check_notes, defects, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, orderMap[pr.order_no], userMap[pr.processor], pr.processing_type, pr.status,
        pr.started_at, pr.completed_at || null, pr.quality_check_by ? userMap[pr.quality_check_by] : null,
        pr.quality_check_result || null, pr.quality_check_notes || null, pr.defects || null, pr.remarks || null)
  }

  db.pragma('foreign_keys = ON')

  console.log('Seed data created successfully!')
  console.log('Test accounts:')
  console.log('  admin / admin123      (系统管理员)')
  console.log('  manager1 / manager123 (中心旗舰店店长)')
  console.log('  manager2 / manager123 (东区分店店长)')
  console.log('  optician1 / optician123 (王验光师)')
  console.log('  optician2 / optician123 (赵验光师)')
  console.log('  processor1 / processor123 (刘加工师)')
  console.log('  processor2 / processor123 (陈加工师)')
  console.log('  service1 / service123 (孙客服)')
}

seed()
