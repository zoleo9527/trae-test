import type { CalendarEvent } from '~/types'

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'c001',
    date: '2024-05-25',
    type: 'restock',
    title: '梵高向日葵徽章补货到货',
    description: '五一假期后库存告急，紧急补货200个',
    status: 'processing',
    relatedRecordId: 'r001'
  },
  {
    id: 'c002',
    date: '2024-05-23',
    type: 'loss',
    title: '星空夜光马克杯损耗',
    description: '顾客挑选时不慎打碎3个',
    status: 'pending',
    relatedRecordId: 'r002'
  },
  {
    id: 'c003',
    date: '2024-05-21',
    type: 'restock',
    title: '蒙娜丽莎拼图补货异常',
    description: '实际到货45盒，与订单50盒不符，缺少5盒',
    status: 'abnormal',
    relatedRecordId: 'r003'
  },
  {
    id: 'c004',
    date: '2024-05-16',
    type: 'loss',
    title: '限定展览丝巾损耗',
    description: '春季收藏家沙龙VIP活动赠礼',
    status: 'completed',
    relatedRecordId: 'r004'
  },
  {
    id: 'c005',
    date: '2024-05-12',
    type: 'restock',
    title: '莫奈睡莲帆布袋补货完成',
    description: '母亲节促销备货100个，已签收入库',
    status: 'completed',
    relatedRecordId: 'r005'
  },
  {
    id: 'c006',
    date: '2024-05-25',
    type: 'ticket_peak',
    title: '周末客流高峰',
    description: '预计客流量3000+，建议检查文创库存',
    status: 'pending'
  },
  {
    id: 'c007',
    date: '2024-05-25',
    type: 'loss',
    title: '艺术大师明信片套装损耗',
    description: '小小艺术家工作坊儿童教育活动使用',
    status: 'approved',
    relatedRecordId: 'r008'
  },
  {
    id: 'c008',
    date: '2024-05-28',
    type: 'exhibition',
    title: '印象派特展开幕',
    description: '新展开幕，文创产品需求预计增长',
    status: 'pending'
  },
  {
    id: 'c009',
    date: '2024-05-21',
    type: 'loss',
    title: '雕塑复刻钥匙扣损耗驳回',
    description: '活动道具使用申请被驳回，请走样品借用流程',
    status: 'rejected',
    relatedRecordId: 'r006'
  },
  {
    id: 'c010',
    date: '2024-05-28',
    type: 'restock',
    title: '美术馆定制笔记本预计到货',
    description: '常规备货200本',
    status: 'pending',
    relatedRecordId: 'r007'
  }
]
