import { get, set, del, clear, createStore } from 'idb-keyval'

const dbStore = createStore('farm-coop-db', 'main')

export const storage = {
  async get(key) {
    try {
      const value = await get(key, dbStore)
      return value
    } catch (e) {
      console.error('Storage get error:', e)
      return null
    }
  },

  async set(key, value) {
    try {
      await set(key, value, dbStore)
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },

  async del(key) {
    try {
      await del(key, dbStore)
      return true
    } catch (e) {
      console.error('Storage del error:', e)
      return false
    }
  },

  async clear() {
    try {
      await clear(dbStore)
      return true
    } catch (e) {
      console.error('Storage clear error:', e)
      return false
    }
  }
}

export async function initStorage() {
  const initialized = await storage.get('initialized')
  if (!initialized) {
    await initDemoData()
    await storage.set('initialized', true)
  }
}

async function initDemoData() {
  const demoUsers = [
    { id: 'u1', name: '张理事', username: 'director', password: '123456', role: 'director', phone: '13800138001' },
    { id: 'u2', name: '李调度', username: 'dispatcher', password: '123456', role: 'dispatcher', phone: '13800138002' },
    { id: 'u3', name: '王机手', username: 'operator', password: '123456', role: 'operator', phone: '13800138003' },
    { id: 'u4', name: '赵机手', username: 'operator2', password: '123456', role: 'operator', phone: '13800138004' }
  ]

  const demoPlots = [
    { id: 'p1', name: '东大片1号', area: 120, location: '东河区一村', farmer: '刘大强', phone: '13900139001', crop: '小麦', status: 'completed', createTime: '2024-05-01' },
    { id: 'p2', name: '西洼地2号', area: 85, location: '西平村二组', farmer: '陈二明', phone: '13900139002', crop: '玉米', status: 'progress', createTime: '2024-05-10' },
    { id: 'p3', name: '南坡地3号', area: 150, location: '南坡村三组', farmer: '张三福', phone: '13900139003', crop: '水稻', status: 'pending', createTime: '2024-05-15' },
    { id: 'p4', name: '北平地4号', area: 95, location: '北安村一组', farmer: '李四喜', phone: '13900139004', crop: '小麦', status: 'delayed', createTime: '2024-05-08' },
    { id: 'p5', name: '中良田5号', area: 200, location: '中兴村二组', farmer: '王五贵', phone: '13900139005', crop: '玉米', status: 'pending', createTime: '2024-05-20' }
  ]

  const demoTasks = [
    { id: 't1', plotId: 'p1', plotName: '东大片1号', type: '收割', operatorId: 'u3', operatorName: '王机手', planDate: '2024-05-05', actualDate: '2024-05-05', status: 'completed', progress: 100, fuelUsed: 120, remark: '作业顺利，无异常', createTime: '2024-05-03 09:00' },
    { id: 't2', plotId: 'p2', plotName: '西洼地2号', type: '播种', operatorId: 'u3', operatorName: '王机手', planDate: '2024-05-15', actualDate: null, status: 'progress', progress: 60, fuelUsed: 45, remark: '正在作业中', createTime: '2024-05-12 14:30' },
    { id: 't3', plotId: 'p3', plotName: '南坡地3号', type: '耕地', operatorId: 'u4', operatorName: '赵机手', planDate: '2024-05-20', actualDate: null, status: 'pending', progress: 0, fuelUsed: 0, remark: '待调度', createTime: '2024-05-16 10:00' },
    { id: 't4', plotId: 'p4', plotName: '北平地4号', type: '收割', operatorId: 'u4', operatorName: '赵机手', planDate: '2024-05-12', actualDate: null, status: 'delayed', progress: 30, fuelUsed: 35, remark: '机械故障延误', createTime: '2024-05-10 08:00' },
    { id: 't5', plotId: 'p5', plotName: '中良田5号', type: '施肥', operatorId: 'u3', operatorName: '王机手', planDate: '2024-05-25', actualDate: null, status: 'pending', progress: 0, fuelUsed: 0, remark: '待确认', createTime: '2024-05-21 11:00' }
  ]

  const demoFuelRecords = [
    { id: 'f1', taskId: 't1', operatorId: 'u3', operatorName: '王机手', fuelType: '柴油', amount: 150, unitPrice: 7.5, totalPrice: 1125, fillDate: '2024-05-04', createBy: 'u2', createTime: '2024-05-04 08:30' },
    { id: 'f2', taskId: 't2', operatorId: 'u3', operatorName: '王机手', fuelType: '柴油', amount: 80, unitPrice: 7.5, totalPrice: 600, fillDate: '2024-05-14', createBy: 'u2', createTime: '2024-05-14 09:00' },
    { id: 'f3', taskId: 't4', operatorId: 'u4', operatorName: '赵机手', fuelType: '柴油', amount: 60, unitPrice: 7.5, totalPrice: 450, fillDate: '2024-05-11', createBy: 'u2', createTime: '2024-05-11 07:30' }
  ]

  const demoSubsidyRecords = [
    { id: 's1', plotId: 'p1', plotName: '东大片1号', subsidyType: '农机作业补贴', amount: 3600, status: 'approved', applyDate: '2024-05-06', approveDate: '2024-05-08', materials: ['作业单', '验收单', '身份证复印件'], remark: '补贴已发放', createBy: 'u2' },
    { id: 's2', plotId: 'p2', plotName: '西洼地2号', subsidyType: '种粮补贴', amount: 2550, status: 'pending', applyDate: '2024-05-16', approveDate: null, materials: ['作业单'], remark: '缺少验收单和身份证复印件', createBy: 'u2' },
    { id: 's3', plotId: 'p4', plotName: '北平地4号', subsidyType: '农机作业补贴', amount: 2850, status: 'rejected', applyDate: '2024-05-13', approveDate: '2024-05-14', materials: ['作业单', '验收单'], remark: '作业未完成，暂不能申请', createBy: 'u2' }
  ]

  const demoReviews = [
    { id: 'r1', plotId: 'p1', taskId: 't1', reviewer: '刘大强', rating: 5, content: '作业质量很好，收割干净，没有遗漏。机手态度也很好，按时完成。', images: [], reviewDate: '2024-05-06', reply: '感谢您的好评，我们会继续保持！', replyBy: 'u2', replyDate: '2024-05-07' },
    { id: 'r2', plotId: 'p4', taskId: 't4', reviewer: '李四喜', rating: 2, content: '作业进度太慢，说好的5月12号完成，现在才做了三分之一。说是机械故障，但也没提前说一声。', images: [], reviewDate: '2024-05-15', reply: '非常抱歉给您带来不便，我们已经安排维修，预计20号前可以完成作业。', replyBy: 'u1', replyDate: '2024-05-15' }
  ]

  const demoAlerts = [
    { id: 'a1', type: 'delay', title: '作业进度延误', content: '北平地4号收割作业已延误3天，机手：赵机手', relatedId: 't4', relatedType: 'task', status: 'unread', createTime: '2024-05-15 08:00', assignee: 'u2' },
    { id: 'a2', type: 'subsidy', title: '补贴材料不齐', content: '西洼地2号补贴申请缺少验收单和身份证复印件', relatedId: 's2', relatedType: 'subsidy', status: 'unread', createTime: '2024-05-17 10:00', assignee: 'u2' },
    { id: 'a3', type: 'review', title: '收到差评回访', content: '北平地4号作业收到2星评价，需要跟进处理', relatedId: 'r2', relatedType: 'review', status: 'read', createTime: '2024-05-15 14:00', assignee: 'u1' },
    { id: 'a4', type: 'maintenance', title: '机械维修提醒', content: '拖拉机#003需要保养，上次保养时间：2024-03-20', relatedId: null, relatedType: 'maintenance', status: 'unread', createTime: '2024-05-18 09:00', assignee: 'u2' }
  ]

  const demoHistoryLogs = [
    { id: 'h1', type: 'task', action: 'create', targetId: 't1', targetName: '东大片1号-收割任务', content: '创建了收割任务，计划日期：2024-05-05', operatorId: 'u2', operatorName: '李调度', createTime: '2024-05-03 09:00' },
    { id: 'h2', type: 'task', action: 'status_change', targetId: 't1', targetName: '东大片1号-收割任务', content: '任务状态从【待执行】变为【进行中】', operatorId: 'u3', operatorName: '王机手', createTime: '2024-05-05 07:00' },
    { id: 'h3', type: 'task', action: 'status_change', targetId: 't1', targetName: '东大片1号-收割任务', content: '任务状态从【进行中】变为【已完成】，进度100%', operatorId: 'u3', operatorName: '王机手', createTime: '2024-05-05 18:00' },
    { id: 'h4', type: 'task', action: 'remark', targetId: 't4', targetName: '北平地4号-收割任务', content: '添加备注：机械故障延误', operatorId: 'u4', operatorName: '赵机手', createTime: '2024-05-13 10:00' },
    { id: 'h5', type: 'subsidy', action: 'create', targetId: 's1', targetName: '东大片1号补贴申请', content: '提交补贴申请，金额：3600元', operatorId: 'u2', operatorName: '李调度', createTime: '2024-05-06 14:00' },
    { id: 'h6', type: 'subsidy', action: 'approve', targetId: 's1', targetName: '东大片1号补贴申请', content: '补贴申请已通过审批', operatorId: 'u1', operatorName: '张理事', createTime: '2024-05-08 11:00' },
    { id: 'h7', type: 'review', action: 'create', targetId: 'r2', targetName: '北平地4号评价', content: '农户提交评价：2星', operatorId: 'system', operatorName: '系统', createTime: '2024-05-15 12:00' },
    { id: 'h8', type: 'alert', action: 'create', targetId: 'a1', targetName: '作业进度延误提醒', content: '系统自动生成延误提醒', operatorId: 'system', operatorName: '系统', createTime: '2024-05-15 08:00' }
  ]

  await storage.set('users', demoUsers)
  await storage.set('plots', demoPlots)
  await storage.set('tasks', demoTasks)
  await storage.set('fuelRecords', demoFuelRecords)
  await storage.set('subsidyRecords', demoSubsidyRecords)
  await storage.set('reviews', demoReviews)
  await storage.set('alerts', demoAlerts)
  await storage.set('historyLogs', demoHistoryLogs)
}
