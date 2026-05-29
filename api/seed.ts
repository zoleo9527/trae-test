import dayjs from 'dayjs'
import { getDb } from './database.js'

const d = (offset: number, format = 'YYYY-MM-DD HH:mm:ss') =>
  dayjs('2026-05-29').add(offset, 'day').format(format)

const dDate = (offset: number) =>
  dayjs('2026-05-29').add(offset, 'day').format('YYYY-MM-DD')

export function seedDb(): void {
  const db = getDb()

  const count = (db.prepare('SELECT COUNT(*) as c FROM plots').get() as { c: number }).c
  if (count > 0) {
    console.log('Database already seeded, skipping.')
    return
  }

  const insertPlot = db.prepare(`
    INSERT INTO plots (id, name, area, species, status, responsible_person, created_at, updated_at)
    VALUES (@id, @name, @area, @species, @status, @responsible_person, @created_at, @updated_at)
  `)

  const insertInventory = db.prepare(`
    INSERT INTO plot_inventory (plot_id, species, total_count, available_count, reserved_count, transferred_count)
    VALUES (@plot_id, @species, @total_count, @available_count, @reserved_count, @transferred_count)
  `)

  const insertStatusLog = db.prepare(`
    INSERT INTO plot_status_log (plot_id, from_status, to_status, reason, operator, note, created_at)
    VALUES (@plot_id, @from_status, @to_status, @reason, @operator, @note, @created_at)
  `)

  const insertTransfer = db.prepare(`
    INSERT INTO transfers (id, plot_id, customer_name, species, quantity, status, created_by, approved_by, expected_date, created_at, updated_at)
    VALUES (@id, @plot_id, @customer_name, @species, @quantity, @status, @created_by, @approved_by, @expected_date, @created_at, @updated_at)
  `)

  const insertTransferNote = db.prepare(`
    INSERT INTO transfer_notes (transfer_id, content, author, type, created_at)
    VALUES (@transfer_id, @content, @author, @type, @created_at)
  `)

  const insertLoadingOrder = db.prepare(`
    INSERT INTO loading_orders (id, transfer_id, vehicle_no, driver_name, status, loaded_at, created_by, created_at)
    VALUES (@id, @transfer_id, @vehicle_no, @driver_name, @status, @loaded_at, @created_by, @created_at)
  `)

  const insertLoadingItem = db.prepare(`
    INSERT INTO loading_items (loading_order_id, species, planned_qty, actual_qty, difference_reason)
    VALUES (@loading_order_id, @species, @planned_qty, @actual_qty, @difference_reason)
  `)

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, plot_id, transfer_id, type, title, status, assignee, priority, due_date, completed_at, created_at)
    VALUES (@id, @plot_id, @transfer_id, @type, @title, @status, @assignee, @priority, @due_date, @completed_at, @created_at)
  `)

  const insertTaskNote = db.prepare(`
    INSERT INTO task_notes (task_id, content, author, created_at)
    VALUES (@task_id, @content, @author, @created_at)
  `)

  const insertDiseaseReport = db.prepare(`
    INSERT INTO disease_reports (id, task_id, plot_id, disease_type, severity, description, reported_by, reported_at, status)
    VALUES (@id, @task_id, @plot_id, @disease_type, @severity, @description, @reported_by, @reported_at, @status)
  `)

  const insertFollowup = db.prepare(`
    INSERT INTO followups (id, transfer_id, customer_name, contact_result, satisfaction, issue_description, followup_by, followup_at, status)
    VALUES (@id, @transfer_id, @customer_name, @contact_result, @satisfaction, @issue_description, @followup_by, @followup_at, @status)
  `)

  const insertNegotiation = db.prepare(`
    INSERT INTO negotiations (id, followup_id, disease_report_id, type, status, result, negotiated_by, created_at, resolved_at)
    VALUES (@id, @followup_id, @disease_report_id, @type, @status, @result, @negotiated_by, @created_at, @resolved_at)
  `)

  const insertNegotiationNote = db.prepare(`
    INSERT INTO negotiation_notes (negotiation_id, content, author, created_at)
    VALUES (@negotiation_id, @content, @author, @created_at)
  `)

  const seedAll = db.transaction(() => {
    // === Plots ===
    const plots = [
      { id: 1, name: 'A区-1号地', area: 'A区', species: '香樟', status: '在养', responsible_person: '张建国', created_at: d(-60), updated_at: d(-1) },
      { id: 2, name: 'A区-2号地', area: 'A区', species: '桂花', status: '已调出', responsible_person: '李明辉', created_at: d(-55), updated_at: d(-3) },
      { id: 3, name: 'B区-1号地', area: 'B区', species: '红枫', status: '在养', responsible_person: '王秀芳', created_at: d(-50), updated_at: d(-2) },
      { id: 4, name: 'B区-2号地', area: 'B区', species: '银杏', status: '在养', responsible_person: '陈大伟', created_at: d(-45), updated_at: d(0) },
      { id: 5, name: 'C区-1号地', area: 'C区', species: '樱花', status: '休整', responsible_person: '张建国', created_at: d(-40), updated_at: d(-5) },
      { id: 6, name: 'C区-2号地', area: 'C区', species: '紫薇', status: '在养', responsible_person: '李明辉', created_at: d(-35), updated_at: d(-1) },
      { id: 7, name: 'D区-1号地', area: 'D区', species: '罗汉松', status: '养护中', responsible_person: '王秀芳', created_at: d(-30), updated_at: d(-2) },
      { id: 8, name: 'D区-2号地', area: 'D区', species: '广玉兰', status: '在养', responsible_person: '陈大伟', created_at: d(-25), updated_at: d(0) },
    ]
    for (const p of plots) insertPlot.run(p)

    // === Plot Inventory ===
    const inventories = [
      { plot_id: 1, species: '香樟', total_count: 500, available_count: 280, reserved_count: 20, transferred_count: 200 },
      { plot_id: 2, species: '桂花', total_count: 400, available_count: 100, reserved_count: 0, transferred_count: 300 },
      { plot_id: 3, species: '红枫', total_count: 350, available_count: 250, reserved_count: 80, transferred_count: 20 },
      { plot_id: 4, species: '银杏', total_count: 600, available_count: 460, reserved_count: 120, transferred_count: 20 },
      { plot_id: 5, species: '樱花', total_count: 200, available_count: 140, reserved_count: 0, transferred_count: 60 },
      { plot_id: 6, species: '紫薇', total_count: 450, available_count: 330, reserved_count: 100, transferred_count: 20 },
      { plot_id: 7, species: '罗汉松', total_count: 150, available_count: 130, reserved_count: 0, transferred_count: 20 },
      { plot_id: 8, species: '广玉兰', total_count: 300, available_count: 280, reserved_count: 0, transferred_count: 20 },
    ]
    for (const inv of inventories) insertInventory.run(inv)

    // === Plot Status Logs ===
    const statusLogs = [
      { plot_id: 1, from_status: '休整', to_status: '在养', reason: '养护周期结束，苗木恢复健康', operator: '张建国', note: '苗木长势良好，可重新进入在养状态', created_at: d(-30) },
      { plot_id: 2, from_status: '在养', to_status: '已调出', reason: '全部桂花已调出完成', operator: '李明辉', note: '订单T1、T2全部完成调出', created_at: d(-3) },
      { plot_id: 5, from_status: '在养', to_status: '休整', reason: '樱花花期结束，需要休整养护', operator: '张建国', note: '花期已过，安排休整期养护计划', created_at: d(-15) },
      { plot_id: 7, from_status: '在养', to_status: '养护中', reason: '发现叶斑病，启动专项养护', operator: '王秀芳', note: '轻度叶斑病，已安排专项养护处理', created_at: d(-10) },
      { plot_id: 7, from_status: '养护中', to_status: '在养', reason: '病虫害已清除，恢复在养', operator: '王秀芳', note: null, created_at: d(-5) },
    ]
    for (const log of statusLogs) insertStatusLog.run(log)

    // === Transfers ===
    const transfers = [
      { id: 1, plot_id: 1, customer_name: '杭州绿城景观', species: '香樟', quantity: 200, status: '已完成', created_by: '赵敏', approved_by: '张建国', expected_date: dDate(-10), created_at: d(-20), updated_at: d(-8) },
      { id: 2, plot_id: 2, customer_name: '上海万科园林', species: '桂花', quantity: 150, status: '已完成', created_by: '赵敏', approved_by: '张建国', expected_date: dDate(-5), created_at: d(-15), updated_at: d(-3) },
      { id: 3, plot_id: 3, customer_name: '苏州园林局', species: '红枫', quantity: 80, status: '进行中', created_by: '赵敏', approved_by: '张建国', expected_date: dDate(3), created_at: d(-7), updated_at: d(-1) },
      { id: 4, plot_id: 4, customer_name: '南京碧桂园', species: '银杏', quantity: 120, status: '待审批', created_by: '赵敏', approved_by: null, expected_date: dDate(7), created_at: d(-2), updated_at: d(-2) },
      { id: 5, plot_id: 5, customer_name: '无锡市政', species: '樱花', quantity: 60, status: '已取消', created_by: '赵敏', approved_by: '张建国', expected_date: dDate(-3), created_at: d(-18), updated_at: d(-12) },
      { id: 6, plot_id: 6, customer_name: '常州恒大', species: '紫薇', quantity: 100, status: '进行中', created_by: '赵敏', approved_by: '李明辉', expected_date: dDate(5), created_at: d(-5), updated_at: d(-1) },
    ]
    for (const t of transfers) insertTransfer.run(t)

    // === Transfer Notes ===
    const transferNotes = [
      { transfer_id: 1, content: '客户需求200株香樟，要求胸径8cm以上，请联系现场确认库存', author: '赵敏', type: '备注', created_at: d(-20) },
      { transfer_id: 1, content: '已确认A区1号地有280株可调香樟，满足客户需求', author: '张建国', type: '备注', created_at: d(-19) },
      { transfer_id: 1, content: '审批通过，安排起苗', author: '张建国', type: '审批', created_at: d(-18) },
      { transfer_id: 1, content: '已装车发往杭州，司机王师傅，车牌苏A12345', author: '张建国', type: '备注', created_at: d(-10) },
      { transfer_id: 1, content: '客户确认收货，苗木状态良好', author: '赵敏', type: '备注', created_at: d(-8) },

      { transfer_id: 2, content: '上海万科园林急需150株桂花，要求冠幅1.5m以上', author: '赵敏', type: '备注', created_at: d(-15) },
      { transfer_id: 2, content: '已审批，请注意桂花质量筛选', author: '张建国', type: '审批', created_at: d(-14) },
      { transfer_id: 2, content: '装车完成，实装135株，差15株因冠幅不达标未装', author: '李明辉', type: '备注', created_at: d(-5) },
      { transfer_id: 2, content: '客户接受差异，余下15株待补发', author: '赵敏', type: '备注', created_at: d(-4) },
      { transfer_id: 2, content: '补发15株桂花已发车', author: '李明辉', type: '备注', created_at: d(-3) },

      { transfer_id: 3, content: '苏州园林局红枫订单，要求树形优美，色泽均匀', author: '赵敏', type: '备注', created_at: d(-7) },
      { transfer_id: 3, content: '已审批，安排起苗队伍', author: '张建国', type: '审批', created_at: d(-6) },
      { transfer_id: 3, content: '起苗进行中，预计明天完成', author: '王秀芳', type: '备注', created_at: d(-1) },

      { transfer_id: 4, content: '南京碧桂园银杏订单，需要审批确认', author: '赵敏', type: '备注', created_at: d(-2) },
      { transfer_id: 4, content: '等待审批，需确认B区2号地银杏数量是否充足', author: '陈大伟', type: '备注', created_at: d(-1) },

      { transfer_id: 5, content: '客户因项目变更取消订单', author: '赵敏', type: '备注', created_at: d(-12) },
      { transfer_id: 5, content: '已取消，樱花退回在养状态', author: '张建国', type: '备注', created_at: d(-12) },

      { transfer_id: 6, content: '常州恒大紫薇需求，要求花期在7-8月', author: '赵敏', type: '备注', created_at: d(-5) },
      { transfer_id: 6, content: '已审批，注意选择花期合适的紫薇', author: '李明辉', type: '审批', created_at: d(-4) },
      { transfer_id: 6, content: '正在选苗，待安排装车', author: '李明辉', type: '备注', created_at: d(-1) },
    ]
    for (const n of transferNotes) insertTransferNote.run(n)

    // === Loading Orders ===
    const loadingOrders = [
      { id: 1, transfer_id: 1, vehicle_no: '苏A12345', driver_name: '王师傅', status: '已完成', loaded_at: d(-10), created_by: '张建国', created_at: d(-11) },
      { id: 2, transfer_id: 2, vehicle_no: '苏B67890', driver_name: '刘师傅', status: '已完成', loaded_at: d(-5), created_by: '李明辉', created_at: d(-6) },
      { id: 3, transfer_id: 3, vehicle_no: null, driver_name: null, status: '待装车', loaded_at: null, created_by: '王秀芳', created_at: d(-3) },
      { id: 4, transfer_id: 6, vehicle_no: '苏C11111', driver_name: '陈师傅', status: '装车中', loaded_at: null, created_by: '李明辉', created_at: d(-1) },
    ]
    for (const lo of loadingOrders) insertLoadingOrder.run(lo)

    // === Loading Items ===
    const loadingItems = [
      { loading_order_id: 1, species: '香樟', planned_qty: 200, actual_qty: 200, difference_reason: null },
      { loading_order_id: 2, species: '桂花', planned_qty: 150, actual_qty: 135, difference_reason: '15株冠幅不达标，未装车' },
      { loading_order_id: 3, species: '红枫', planned_qty: 80, actual_qty: 0, difference_reason: null },
      { loading_order_id: 4, species: '紫薇', planned_qty: 100, actual_qty: 0, difference_reason: null },
    ]
    for (const li of loadingItems) insertLoadingItem.run(li)

    // === Tasks ===
    const tasks = [
      { id: 1, plot_id: 1, transfer_id: 1, type: '起苗', title: '香樟起苗-杭州绿城订单', status: '已完成', assignee: '张建国', priority: '紧急', due_date: dDate(-10), completed_at: d(-10), created_at: d(-18) },
      { id: 2, plot_id: 2, transfer_id: 2, type: '起苗', title: '桂花起苗-上海万科订单', status: '已完成', assignee: '李明辉', priority: '紧急', due_date: dDate(-5), completed_at: d(-5), created_at: d(-14) },
      { id: 3, plot_id: 3, transfer_id: 3, type: '起苗', title: '红枫起苗-苏州园林局订单', status: '进行中', assignee: '王秀芳', priority: '紧急', due_date: dDate(1), completed_at: null, created_at: d(-6) },
      { id: 4, plot_id: 6, transfer_id: 6, type: '起苗', title: '紫薇起苗-常州恒大订单', status: '待处理', assignee: '李明辉', priority: '高', due_date: dDate(3), completed_at: null, created_at: d(-4) },
      { id: 5, plot_id: 1, transfer_id: null, type: '养护', title: 'A区香樟日常养护', status: '进行中', assignee: '张建国', priority: '普通', due_date: dDate(5), completed_at: null, created_at: d(-10) },
      { id: 6, plot_id: 7, transfer_id: null, type: '养护', title: '罗汉松专项养护-叶斑病防治', status: '进行中', assignee: '王秀芳', priority: '高', due_date: dDate(2), completed_at: null, created_at: d(-10) },
      { id: 7, plot_id: 8, transfer_id: null, type: '养护', title: '广玉兰施肥养护', status: '待处理', assignee: '陈大伟', priority: '普通', due_date: dDate(7), completed_at: null, created_at: d(-3) },
      { id: 8, plot_id: 3, transfer_id: null, type: '病害', title: '红枫锈病巡检', status: '进行中', assignee: '王秀芳', priority: '高', due_date: dDate(-1), completed_at: null, created_at: d(-8) },
      { id: 9, plot_id: 4, transfer_id: null, type: '病害', title: '银杏叶枯病检查', status: '待处理', assignee: '陈大伟', priority: '普通', due_date: dDate(4), completed_at: null, created_at: d(-2) },
      { id: 10, plot_id: 5, transfer_id: null, type: '养护', title: '樱花休整期养护', status: '进行中', assignee: '张建国', priority: '普通', due_date: dDate(10), completed_at: null, created_at: d(-15) },
      { id: 11, plot_id: 7, transfer_id: null, type: '病害', title: '罗汉松蚜虫防治', status: '待处理', assignee: '王秀芳', priority: '紧急', due_date: dDate(0), completed_at: null, created_at: d(-1) },
      { id: 12, plot_id: 2, transfer_id: null, type: '养护', title: '桂花地块清理整备', status: '待处理', assignee: '李明辉', priority: '普通', due_date: dDate(8), completed_at: null, created_at: d(-2) },
    ]
    for (const t of tasks) insertTask.run(t)

    // === Task Notes ===
    const taskNotes = [
      { task_id: 1, content: '起苗工作开始，预计2天完成', author: '张建国', created_at: d(-11) },
      { task_id: 1, content: '200株香樟全部起苗完成，质量合格', author: '张建国', created_at: d(-10) },
      { task_id: 2, content: '桂花起苗中，部分苗木冠幅不足需筛选', author: '李明辉', created_at: d(-6) },
      { task_id: 2, content: '起苗完成，135株达标，15株待补', author: '李明辉', created_at: d(-5) },
      { task_id: 3, content: '红枫起苗队伍已进场，开始作业', author: '王秀芳', created_at: d(-2) },
      { task_id: 3, content: '起苗进度约60%，预计明天完成', author: '王秀芳', created_at: d(-1) },
      { task_id: 5, content: '日常浇水、施肥，苗木长势正常', author: '张建国', created_at: d(-5) },
      { task_id: 6, content: '发现叶斑病，已喷洒杀菌剂', author: '王秀芳', created_at: d(-8) },
      { task_id: 6, content: '第二次施药，病情有所控制', author: '王秀芳', created_at: d(-3) },
      { task_id: 8, content: '巡检发现少量锈斑，需要持续观察', author: '王秀芳', created_at: d(-7) },
      { task_id: 8, content: '锈斑有所扩散，建议加强防治', author: '王秀芳', created_at: d(-3) },
      { task_id: 10, content: '休整期开始，安排修剪和施肥', author: '张建国', created_at: d(-15) },
      { task_id: 10, content: '修剪完成，施肥进行中', author: '张建国', created_at: d(-5) },
      { task_id: 11, content: '发现蚜虫聚集，需紧急处理', author: '王秀芳', created_at: d(-1) },
    ]
    for (const n of taskNotes) insertTaskNote.run(n)

    // === Disease Reports ===
    const diseaseReports = [
      { id: 1, task_id: 6, plot_id: 7, disease_type: '叶斑病', severity: '轻度', description: '罗汉松叶片出现少量褐色斑点，初步判断为真菌感染', reported_by: '王秀芳', reported_at: d(-10), status: '处理中' },
      { id: 2, task_id: 8, plot_id: 3, disease_type: '锈病', severity: '中度', description: '红枫叶片背面出现锈色粉状物，面积约20%叶片受影响', reported_by: '王秀芳', reported_at: d(-7), status: '处理中' },
      { id: 3, task_id: 9, plot_id: 4, disease_type: '叶枯病', severity: '轻度', description: '银杏叶尖出现枯黄，可能为叶枯病初期', reported_by: '陈大伟', reported_at: d(-5), status: '待确认' },
      { id: 4, task_id: 11, plot_id: 7, disease_type: '蚜虫', severity: '重度', description: '罗汉松新梢蚜虫大量聚集，严重影响生长', reported_by: '王秀芳', reported_at: d(-1), status: '待确认' },
    ]
    for (const dr of diseaseReports) insertDiseaseReport.run(dr)

    // === Followups ===
    const followups = [
      { id: 1, transfer_id: 1, customer_name: '杭州绿城景观', contact_result: '客户满意', satisfaction: '满意', issue_description: '客户对苗木质量满意，无额外需求', followup_by: '赵敏', followup_at: d(-6), status: '已完成' },
      { id: 2, transfer_id: 2, customer_name: '上海万科园林', contact_result: '客户有补发需求', satisfaction: '一般', issue_description: '客户反映装车差15株，需要补发', followup_by: '赵敏', followup_at: d(-4), status: '已完成' },
      { id: 3, transfer_id: 2, customer_name: '上海万科园林', contact_result: null, satisfaction: null, issue_description: '补发苗木质量确认回访', followup_by: '赵敏', followup_at: dDate(2), status: '待回访' },
      { id: 4, transfer_id: 1, customer_name: '杭州绿城景观', contact_result: null, satisfaction: null, issue_description: '客户反映部分苗木栽种后出现叶片发黄', followup_by: '赵敏', followup_at: dDate(1), status: '待回访' },
      { id: 5, transfer_id: 6, customer_name: '常州恒大', contact_result: null, satisfaction: null, issue_description: '新订单回访，确认客户需求细节', followup_by: '赵敏', followup_at: dDate(4), status: '待回访' },
    ]
    for (const f of followups) insertFollowup.run(f)

    // === Negotiations ===
    const negotiations = [
      { id: 1, followup_id: 2, disease_report_id: null, type: '补苗协商', status: '已解决', result: '补发15株桂花，已安排发货', negotiated_by: '赵敏', created_at: d(-4), resolved_at: d(-3) },
      { id: 2, followup_id: 4, disease_report_id: 3, type: '补苗协商', status: '协商中', result: null, negotiated_by: '赵敏', created_at: d(-1), resolved_at: null },
      { id: 3, followup_id: null, disease_report_id: 4, type: '病害赔偿', status: '协商中', result: null, negotiated_by: '王秀芳', created_at: d(-1), resolved_at: null },
    ]
    for (const n of negotiations) insertNegotiation.run(n)

    // === Negotiation Notes ===
    const negotiationNotes = [
      { negotiation_id: 1, content: '客户要求补发15株桂花，冠幅需达标', author: '赵敏', created_at: d(-4) },
      { negotiation_id: 1, content: '已确认库存有达标桂花，安排补发', author: '李明辉', created_at: d(-4) },
      { negotiation_id: 1, content: '15株桂花已发车，协商完成', author: '赵敏', created_at: d(-3) },

      { negotiation_id: 2, content: '客户反映杭州项目栽种的香樟部分叶片发黄，怀疑苗木品质问题', author: '赵敏', created_at: d(-1) },
      { negotiation_id: 2, content: '已安排技术人员前往现场查看', author: '张建国', created_at: d(-1) },
      { negotiation_id: 2, content: '初步判断为运输途中轻微脱水，非苗木品质问题，建议加强浇水', author: '张建国', created_at: d(0) },

      { negotiation_id: 3, content: '罗汉松蚜虫严重，若影响已调出苗木需协商赔偿方案', author: '王秀芳', created_at: d(-1) },
      { negotiation_id: 3, content: '已联系客户说明情况，客户表示理解，等待后续观察', author: '赵敏', created_at: d(0) },
    ]
    for (const n of negotiationNotes) insertNegotiationNote.run(n)
  })

  seedAll()
  console.log('Database seeded successfully.')
}
