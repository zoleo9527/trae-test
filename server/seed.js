const db = require('./db')

db.exec('PRAGMA foreign_keys = ON')
const tx = db.transaction(() => {
  const ins = (sql, args) => db.prepare(sql).run(...args)

  db.prepare("DELETE FROM payments").run()
  db.prepare("DELETE FROM credits").run()
  db.prepare("DELETE FROM claims").run()
  db.prepare("DELETE FROM losses").run()
  db.prepare("DELETE FROM grading").run()
  db.prepare("DELETE FROM picking").run()
  db.prepare("DELETE FROM stock_movements").run()
  db.prepare("DELETE FROM batches").run()
  db.prepare("DELETE FROM operators").run()

  ins('INSERT INTO operators(name, role, phone) VALUES (?,?,?)', ['陈立', '档口负责人', '13800000001'])
  ins('INSERT INTO operators(name, role, phone) VALUES (?,?,?)', ['王海', '配货员', '13800000002'])
  ins('INSERT INTO operators(name, role, phone) VALUES (?,?,?)', ['周敏', '财务记账', '13800000003'])
  ins('INSERT INTO operators(name, role, phone) VALUES (?,?,?)', ['张涛', '冷库管理', '13800000004'])

  const B = (code, fruit, variety, origin, supplier, received_at, gross, tare, price, rule, warehouse, status) =>
    ins('INSERT INTO batches(code, fruit, variety, origin, supplier, received_at, gross_kg, tare_kg, net_kg, unit_price, grade_rule, warehouse, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [code, fruit, variety, origin, supplier, received_at, gross, tare, gross - tare, price, rule, warehouse, status])

  B('B-20260501-A', '苹果', '红富士 80#', '山东烟台', '烟台汇果', '2026-05-01 06:20', 4820, 320, 7.6, '按果径+着色两级', 'A区-03', 'received')
  B('B-20260503-B', '梨', '鸭梨', '河北赵县', '赵县兴农', '2026-05-03 07:10', 3650, 260, 5.8, '只分级不精选', 'A区-05', 'received')
  B('B-20260505-C', '橙子', '赣南脐橙 75#', '江西赣州', '赣州丰源', '2026-05-05 05:40', 5200, 340, 8.9, '果径+表皮三级', 'B区-01', 'received')
  B('B-20260508-D', '西瓜', '麒麟瓜', '海南', '海南绿岛', '2026-05-08 04:30', 6400, 200, 3.2, '按重量分两档', 'B区-02', 'received')
  B('B-20260510-E', '火龙果', '红心', '越南', '南宁越贸', '2026-05-10 08:10', 2100, 180, 11.5, '按单重分两级', 'C区-01', 'received')
  B('B-20260512-F', '芒果', '台农', '广西百色', '百色佳果', '2026-05-12 06:40', 2900, 220, 9.8, '熟度+表皮', 'C区-02', 'received')
  B('B-20260514-G', '桃子', '水蜜桃', '江苏无锡', '无锡阳山', '2026-05-14 07:00', 1800, 150, 12.5, '熟度分级', 'C区-03', 'received')

  const SM = (batch_id, type, qty, at, operator, note, ref) =>
    ins('INSERT INTO stock_movements(batch_id, type, qty_kg, at, operator, note, ref) VALUES (?,?,?,?,?,?,?)',
      [batch_id, type, qty, at, operator, note, ref])

  SM(1, 'in', 4500, '2026-05-01 08:00', '张涛', '过磅后净 4500kg 入库 A-03', '磅单磅-20260501-A')
  SM(1, 'out', 1200, '2026-05-02 09:00', '王海', '配给东兴水果店', '配货 P-0502-01')
  SM(1, 'out', 800, '2026-05-04 10:30', '王海', '配给阳光超市', '配货 P-0504-01')
  SM(2, 'in', 3390, '2026-05-03 09:20', '张涛', '入库 A-05', '磅单磅-20260503-B')
  SM(2, 'out', 900, '2026-05-05 08:00', '王海', '配给东兴水果店', '配货 P-0505-01')
  SM(3, 'in', 4860, '2026-05-05 07:30', '张涛', '入库 B-01', '磅单磅-20260505-C')
  SM(3, 'out', 1500, '2026-05-07 08:30', '王海', '配给家乐购', '配货 P-0507-01')
  SM(4, 'in', 6200, '2026-05-08 06:00', '张涛', '入库 B-02', '磅单磅-20260508-D')
  SM(4, 'out', 2000, '2026-05-09 07:00', '王海', '配给阳光超市', '配货 P-0509-01')
  SM(5, 'in', 1920, '2026-05-10 10:00', '张涛', '入库 C-01', '磅单磅-20260510-E')
  SM(6, 'in', 2680, '2026-05-12 08:20', '张涛', '入库 C-02', '磅单磅-20260512-F')
  SM(7, 'in', 1650, '2026-05-14 08:50', '张涛', '入库 C-03', '磅单磅-20260514-G')

  const G = (batch_id, at, grade, qty, op, note) =>
    ins('INSERT INTO grading(batch_id, graded_at, grade, qty_kg, operator, note) VALUES (?,?,?,?,?,?)',
      [batch_id, at, grade, qty, op, note])
  G(1, '2026-05-01 14:00', 'A', 3200, '陈立', '果径≥80mm，着色≥80%')
  G(1, '2026-05-01 14:00', 'B', 1100, '陈立', '果径75-80，着色60-80%')
  G(1, '2026-05-01 14:00', 'C', 150, '陈立', '小果/着色不足，留作处理货')
  G(2, '2026-05-03 15:00', 'A', 2800, '陈立', '果形端正，表皮光滑')
  G(2, '2026-05-03 15:00', 'B', 550, '陈立', '轻微碰伤，二级果')
  G(3, '2026-05-05 15:30', 'A', 3600, '陈立', '75#，表皮油亮')
  G(3, '2026-05-05 15:30', 'B', 1100, '陈立', '70#，表皮一般')
  G(3, '2026-05-05 15:30', 'C', 160, '陈立', '小果/花皮')
  G(4, '2026-05-08 10:00', 'A', 4500, '陈立', '单果6kg以上')
  G(4, '2026-05-08 10:00', 'B', 1600, '陈立', '单果4-6kg')
  G(5, '2026-05-10 14:00', 'A', 1500, '陈立', '红心，单果450g+')
  G(5, '2026-05-10 14:00', 'B', 380, '陈立', '单果350-450g')
  G(6, '2026-05-12 14:00', 'A', 2200, '陈立', '8成熟，表皮完好')
  G(6, '2026-05-12 14:00', 'B', 420, '陈立', '7成熟以下')
  G(7, '2026-05-14 14:00', 'A', 1300, '陈立', '8成熟以上')
  G(7, '2026-05-14 14:00', 'B', 320, '陈立', '7成熟')

  const P = (batch_id, customer, order, at, qty, grade, driver, status, note) =>
    ins('INSERT INTO picking(batch_id, customer, order_no, picked_at, qty_kg, grade, driver, status, note) VALUES (?,?,?,?,?,?,?,?,?)',
      [batch_id, customer, order, at, qty, grade, driver, status, note])
  P(1, '东兴水果店', 'D-0502-01', '2026-05-02 09:00', 1200, 'A', '李师傅', 'delivered', '红富士 A级')
  P(1, '阳光超市', 'D-0504-01', '2026-05-04 10:30', 800, 'A', '李师傅', 'delivered', '红富士 A级')
  P(2, '东兴水果店', 'D-0505-01', '2026-05-05 08:00', 900, 'A', '李师傅', 'delivered', '鸭梨 A级')
  P(3, '家乐购', 'D-0507-01', '2026-05-07 08:30', 1500, 'A', '赵师傅', 'delivered', '脐橙 A级')
  P(4, '阳光超市', 'D-0509-01', '2026-05-09 07:00', 2000, 'A', '赵师傅', 'delivered', '麒麟瓜 A级')
  P(5, '东兴水果店', 'D-0511-01', '2026-05-11 10:00', 400, 'A', '李师傅', 'delivered', '火龙果 A级')
  P(6, '家乐购', 'D-0513-01', '2026-05-13 09:30', 500, 'A', '赵师傅', 'delivered', '芒果 A级')

  const C = (customer, picking_id, amount, issued_at, due_at, settled_at, status, note) =>
    ins('INSERT INTO credits(customer, picking_id, amount, issued_at, due_at, settled_at, status, note) VALUES (?,?,?,?,?,?,?,?)',
      [customer, picking_id, amount, issued_at, due_at, settled_at, status, note])
  C('东兴水果店', 1, 1200 * 9.1, '2026-05-02', '2026-05-09', '2026-05-09', 'settled', '正常赊销7天')
  C('阳光超市', 2, 800 * 9.1, '2026-05-04', '2026-05-11', null, 'open', '正常赊销7天，待到期提醒')
  C('东兴水果店', 3, 900 * 6.8, '2026-05-05', '2026-05-12', '2026-05-12', 'settled', '')
  C('家乐购', 4, 1500 * 10.5, '2026-05-07', '2026-05-14', null, 'overdue', '已逾期，客户电话沟通中')
  C('阳光超市', 5, 2000 * 3.9, '2026-05-09', '2026-05-16', null, 'open', '')
  C('东兴水果店', 6, 400 * 13.5, '2026-05-11', '2026-05-18', null, 'open', '')
  C('家乐购', 7, 500 * 11.5, '2026-05-13', '2026-05-20', null, 'open', '')

  const PAY = (credit_id, amount, paid_at, method, note) =>
    ins('INSERT INTO payments(credit_id, amount, paid_at, method, note) VALUES (?,?,?,?,?)',
      [credit_id, amount, paid_at, method, note])
  PAY(1, 1200 * 9.1, '2026-05-09', '银行转账', '周敏记账，全额')
  PAY(3, 900 * 6.8, '2026-05-12', '微信转账', '周敏记账')

  const CL = (customer, picking_id, reported_at, reason, qty, amount, status, resolution, note) =>
    ins('INSERT INTO claims(customer, picking_id, reported_at, reason, qty_kg, amount, status, resolution, note) VALUES (?,?,?,?,?,?,?,?,?)',
      [customer, picking_id, reported_at, reason, qty, amount, status, resolution, note])
  CL('家乐购', 4, '2026-05-08', '到货24小时内发现表皮花皮果占比高', 60, 630, 'reviewing', null, '客户提供到货开箱照片，要求复核')
  CL('阳光超市', 2, '2026-05-06', '部分苹果压伤，比例较小', 12, 110, 'resolved', '折价退款 110 元', '财务已记账，客户确认')

  const L = (batch_id, found_at, kind, qty, cause, amount, reviewer, status, note) =>
    ins('INSERT INTO losses(batch_id, found_at, kind, qty_kg, cause, amount, reviewed_by, status, note) VALUES (?,?,?,?,?,?,?,?,?)',
      [batch_id, found_at, kind, qty, cause, amount, reviewer, status, note])
  L(3, '2026-05-10', '自然损耗', 40, '库内温度波动+表皮失水', 356, '陈立', 'confirmed', '周盘点发现，与分级时估计一致')
  L(4, '2026-05-11', '客户损耗争议', 120, '与家乐购客诉争议关联，待复核', 468, null, 'pending', '需与客户争议单 CL-001 关联确认')
  L(6, '2026-05-15', '配货损伤', 20, '装车挤压', 196, '陈立', 'confirmed', '装车时压伤，现场拍照')
})
tx()

console.log('seed done')
