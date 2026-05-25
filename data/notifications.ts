import type { Notification } from '~/types'

export const notifications: Notification[] = [
  {
    id: 'n001',
    title: '补货异常提醒',
    content: '达芬奇蒙娜丽莎拼图补货数量不符，缺少5盒，请及时处理',
    type: 'error',
    timestamp: '2024-05-22T09:00:00',
    isRead: false,
    relatedRecordId: 'r003',
    priority: 'high'
  },
  {
    id: 'n002',
    title: '待审批损耗记录',
    content: '星空夜光马克杯损耗3个，等待您的审批',
    type: 'warning',
    timestamp: '2024-05-23T10:15:00',
    isRead: false,
    relatedRecordId: 'r002',
    priority: 'medium'
  },
  {
    id: 'n003',
    title: '补货申请已通过',
    content: '梵高向日葵金属徽章补货申请已批准，供应商备货中',
    type: 'success',
    timestamp: '2024-05-20T11:00:00',
    isRead: true,
    relatedRecordId: 'r001',
    priority: 'medium'
  },
  {
    id: 'n004',
    title: '周末客流高峰预警',
    content: '5月25日-26日预计客流高峰，请提前检查文创商品库存',
    type: 'warning',
    timestamp: '2024-05-23T08:00:00',
    isRead: false,
    priority: 'high'
  },
  {
    id: 'n005',
    title: '损耗申请被驳回',
    content: '雕塑复刻钥匙扣损耗申请已驳回，请走样品借用流程',
    type: 'info',
    timestamp: '2024-05-21T17:00:00',
    isRead: true,
    relatedRecordId: 'r006',
    priority: 'low'
  },
  {
    id: 'n006',
    title: '补货预计今日到货',
    content: '梵高向日葵徽章200个预计今日送达，请准备验收',
    type: 'info',
    timestamp: '2024-05-25T09:00:00',
    isRead: false,
    relatedRecordId: 'r001',
    priority: 'medium'
  },
  {
    id: 'n007',
    title: '活动执行提交补货申请',
    content: '美术馆定制笔记本常规补货200本，等待审批',
    type: 'info',
    timestamp: '2024-05-23T09:00:00',
    isRead: false,
    relatedRecordId: 'r007',
    priority: 'low'
  },
  {
    id: 'n008',
    title: '活动损耗已批准',
    content: '小小艺术家工作坊明信片损耗5套已批准',
    type: 'success',
    timestamp: '2024-05-22T14:00:00',
    isRead: true,
    relatedRecordId: 'r008',
    priority: 'medium'
  }
]
