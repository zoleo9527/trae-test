const Database = require('better-sqlite3')
const path = require('path')
const os = require('os')

const dbPath = path.join(os.homedir(), 'Library/Application Support/scrap-station-manager/scrap-station.db')
const db = new Database(dbPath)

console.log('数据库路径:', dbPath)

function initDemoData() {
  console.log('开始生成演示数据...')

  db.exec(`DELETE FROM operation_logs`)
  db.exec(`DELETE FROM exceptions`)
  db.exec(`DELETE FROM env_records`)
  db.exec(`DELETE FROM settlements`)
  db.exec(`DELETE FROM weighings`)
  db.exec(`DELETE FROM vehicles`)
  db.exec(`DELETE FROM price_history`)
  
  const vehicles = [
    { plate_number: '京A12345', driver_name: '张三', driver_phone: '13800138001', vehicle_type: 'truck', tare_weight: 5000 },
    { plate_number: '京B67890', driver_name: '李四', driver_phone: '13800138002', vehicle_type: 'truck', tare_weight: 4500 },
    { plate_number: '京C11111', driver_name: '王五', driver_phone: '13800138003', vehicle_type: 'tricycle', tare_weight: 500 },
    { plate_number: '京D22222', driver_name: '赵六', driver_phone: '13800138004', vehicle_type: 'van', tare_weight: 2000 },
    { plate_number: '京E33333', driver_name: '孙七', driver_phone: '13800138005', vehicle_type: 'truck', tare_weight: 5500 },
  ]

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (plate_number, driver_name, driver_phone, vehicle_type, tare_weight)
    VALUES (?, ?, ?, ?, ?)
  `)
  vehicles.forEach(v => insertVehicle.run(v.plate_number, v.driver_name, v.driver_phone, v.vehicle_type, v.tare_weight))
  console.log('插入车辆数据:', vehicles.length, '条')

  const materials = db.prepare('SELECT * FROM materials').all()

  const weighings = [
    {
      plate_number: '京A12345',
      material_id: materials.find(m => m.code === 'FE001').id,
      gross_weight: 12500,
      tare_weight: 5000,
      unit_price: 1.2,
      weigher_id: 2,
      status: 'pending',
      remarks: ''
    },
    {
      plate_number: '京B67890',
      material_id: materials.find(m => m.code === 'FE002').id,
      gross_weight: 10800,
      tare_weight: 4500,
      unit_price: 1.5,
      weigher_id: 2,
      status: 'settled',
      remarks: ''
    },
    {
      plate_number: '京C11111',
      material_id: materials.find(m => m.code === 'PAP001').id,
      gross_weight: 1800,
      tare_weight: 500,
      unit_price: 0.9,
      weigher_id: 2,
      status: 'pending',
      remarks: '价格异常，手动调整'
    },
    {
      plate_number: '京D22222',
      material_id: materials.find(m => m.code === 'CU001').id,
      gross_weight: 2800,
      tare_weight: 2000,
      unit_price: 25.0,
      weigher_id: 2,
      status: 'settled',
      remarks: ''
    },
    {
      plate_number: '京E33333',
      material_id: materials.find(m => m.code === 'AL001').id,
      gross_weight: 8500,
      tare_weight: 5500,
      unit_price: 8.0,
      weigher_id: 2,
      status: 'cancelled',
      remarks: '数据录入错误，已作废'
    },
    {
      plate_number: '京A12345',
      material_id: materials.find(m => m.code === 'PLA001').id,
      gross_weight: 7200,
      tare_weight: 5000,
      unit_price: 1.0,
      weigher_id: 2,
      status: 'pending',
      remarks: ''
    },
    {
      plate_number: '京B67890',
      material_id: materials.find(m => m.code === 'FE001').id,
      gross_weight: 9600,
      tare_weight: 4500,
      unit_price: 1.3,
      weigher_id: 2,
      status: 'pending',
      remarks: '单价高于定价'
    }
  ]

  const insertWeighing = db.prepare(`
    INSERT INTO weighings (weighing_no, vehicle_id, material_id, gross_weight, tare_weight, net_weight, unit_price, total_amount, status, weigher_id, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let weighingIndex = 1
  const createdWeighings = []

  weighings.forEach(w => {
    const vehicle = db.prepare('SELECT id FROM vehicles WHERE plate_number = ?').get(w.plate_number)
    if (!vehicle) return
    
    const netWeight = w.gross_weight - w.tare_weight
    const totalAmount = netWeight * w.unit_price
    const weighingNo = `WB20250526${String(weighingIndex).padStart(4, '0')}`
    weighingIndex++
    
    const result = insertWeighing.run(
      weighingNo, vehicle.id, w.material_id,
      w.gross_weight, w.tare_weight, netWeight, w.unit_price, totalAmount,
      w.status, w.weigher_id, w.remarks
    )
    
    createdWeighings.push({ id: result.lastInsertRowid, weighingNo, ...w, netWeight, totalAmount })
  })
  console.log('插入过磅数据:', createdWeighings.length, '条')

  const settledWeighings = createdWeighings.filter(w => w.status === 'settled')
  const pendingWeighings = createdWeighings.filter(w => w.status === 'pending')

  const settlements = [
    {
      weighingIds: settledWeighings.slice(0, 2).map(w => w.id).join(','),
      total_weight: settledWeighings.slice(0, 2).reduce((sum, w) => sum + w.netWeight, 0),
      total_amount: settledWeighings.slice(0, 2).reduce((sum, w) => sum + w.totalAmount, 0),
      deduction: 0,
      deduction_reason: '',
      actual_amount: settledWeighings.slice(0, 2).reduce((sum, w) => sum + w.totalAmount, 0),
      status: 'approved',
      accountant_id: 3,
      reviewer_id: 1,
      payment_method: 'cash',
      payment_time: '2025-05-26 15:30:00',
      remarks: ''
    },
    {
      weighingIds: pendingWeighings.slice(0, 2).map(w => w.id).join(','),
      total_weight: pendingWeighings.slice(0, 2).reduce((sum, w) => sum + w.netWeight, 0),
      total_amount: pendingWeighings.slice(0, 2).reduce((sum, w) => sum + w.totalAmount, 0),
      deduction: 100,
      deduction_reason: '杂质超标扣款',
      actual_amount: pendingWeighings.slice(0, 2).reduce((sum, w) => sum + w.totalAmount, 0) - 100,
      status: 'pending',
      accountant_id: 3,
      reviewer_id: null,
      payment_method: 'bank',
      payment_time: null,
      remarks: ''
    }
  ]

  const insertSettlement = db.prepare(`
    INSERT INTO settlements (settlement_no, weighing_ids, total_weight, total_amount, actual_amount, deduction, deduction_reason, status, accountant_id, reviewer_id, payment_method, payment_time, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let settlementIndex = 1
  settlements.forEach(s => {
    const settlementNo = `ST20250526${String(settlementIndex).padStart(4, '0')}`
    settlementIndex++
    insertSettlement.run(
      settlementNo, s.weighingIds, s.total_weight, s.total_amount, s.actual_amount,
      s.deduction, s.deduction_reason, s.status, s.accountant_id, s.reviewer_id,
      s.payment_method, s.payment_time, s.remarks
    )
  })
  console.log('插入结算数据:', settlements.length, '条')

  const exceptions = [
    {
      type: 'price_deviation',
      related_id: createdWeighings.find(w => w.remarks.includes('价格异常'))?.id,
      description: '过磅单单价与当前定价不符，废纸定价0.8元/kg，实际使用0.9元/kg',
      severity: 'warning',
      resolved: 0
    },
    {
      type: 'price_deviation',
      related_id: createdWeighings.find(w => w.remarks.includes('单价高于定价'))?.id,
      description: '过磅单单价高于定价，废铁定价1.2元/kg，实际使用1.3元/kg',
      severity: 'warning',
      resolved: 0
    },
    {
      type: 'deduction',
      related_id: 2,
      description: '结算单扣款100元，原因：杂质超标扣款',
      severity: 'warning',
      resolved: 0
    },
    {
      type: 'weight_anomaly',
      related_id: createdWeighings.find(w => w.status === 'cancelled')?.id,
      description: '过磅单已作废，原因：数据录入错误',
      severity: 'danger',
      resolved: 1
    }
  ]

  const insertException = db.prepare(`
    INSERT INTO exceptions (type, related_id, description, severity, resolved)
    VALUES (?, ?, ?, ?, ?)
  `)
  exceptions.forEach(e => insertException.run(e.type, e.related_id, e.description, e.severity, e.resolved))
  console.log('插入异常数据:', exceptions.length, '条')

  const envRecords = [
    { record_date: '2025-05-25', record_type: 'env_check', content: '当日环保检查完成，场地清洁，消防器材齐全有效。', recorder_id: 1, status: 'published' },
    { record_date: '2025-05-26', record_type: 'purchase', content: '购进废铁12吨、废铜0.8吨，来源登记完整。', recorder_id: 1, status: 'published' },
    { record_date: '2025-05-26', record_type: 'sale', content: '出售废钢8吨至XX钢铁厂，出库手续齐全。', recorder_id: 1, status: 'draft' },
  ]

  const insertEnv = db.prepare(`
    INSERT INTO env_records (record_date, record_type, content, recorder_id, status)
    VALUES (?, ?, ?, ?, ?)
  `)
  envRecords.forEach(r => insertEnv.run(r.record_date, r.record_type, r.content, r.recorder_id, r.status))
  console.log('插入环保台账:', envRecords.length, '条')

  console.log('\n演示数据生成完成！')
  console.log('\n测试账号:')
  console.log('  老板(owner): admin / admin123')
  console.log('  过磅员(weigher): weigher / weigher123')
  console.log('  财务(accountant): accountant / account123')
  console.log('\n异常测试场景:')
  console.log('  1. 价格异常 - 废纸过磅单单价0.9元，定价0.8元')
  console.log('  2. 扣款记录 - 结算单扣款100元')
  console.log('  3. 作废过磅单 - 已作废的过磅记录')
  console.log('  4. 待复核结算 - 需要站长审批的结算单')
}

initDemoData()
db.close()
