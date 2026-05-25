import type { CalendarEvent } from '~/types'

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'c001',
    date: '2024-05-20',
    type: 'restock',
    title: '梵高向日葵徽章补货申请',
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
    date: '2024-05-18',
    type: 'restock',
    title: '蒙娜丽莎拼图补货',
    description: '到货数量异常，缺少5盒',
    status: 'abnormal',
    relatedRecordId: 'r003'
  },
  {
    id: 'c004',
    date: '2024-05-15',
    type: 'event',
    title: '春季收藏家沙龙',
    description: 'VIP活动，使用限定丝巾作为礼品',
    status: 'completed',
    relatedRecordId: 'r004'
  },
  {
    id: 'c005',
    date: '2024-05-10',
    type: 'restock',
    title: '莫奈睡莲帆布袋补货',
    description: '母亲节促销备货100个',
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
    date: '2024-05-22',
    type: 'event',
    title: '小小艺术家工作坊',
    description: '儿童教育活动，使用明信片套装',
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
    date: '2024-05-25',
    type: 'restock',
    title: '徽章补货预计到货',
    description: '向日葵徽章200个预计今日送达',
    status: 'processing',
    relatedRecordId: 'r001'
  }
]
