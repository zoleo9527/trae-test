import type { Database } from '@/types'

export const initialData: Database = {
  actors: [
    { id: 'a1', name: '林岚', role: 'manager', store: '南京·新街口旗舰店', title: '店经理' },
    { id: 'a2', name: '周知野', role: 'optometrist', store: '南京·新街口旗舰店', title: '验光师' },
    { id: 'a3', name: '陈默', role: 'workshop', store: '中央加工中心', title: '加工跟单' },
    { id: 'a4', name: '苏芮', role: 'service', store: '南京·新街口旗舰店', title: '售后专员' },
  ],
  customers: [
    { id: 'c1', name: '沈砚', phone: '138****2201', memberNo: 'M-20831' },
    { id: 'c2', name: '白棠', phone: '139****1147', memberNo: 'M-20842' },
    { id: 'c3', name: '许观', phone: '135****7788', memberNo: 'M-20910' },
  ],
  packages: [
    { id: 'p1', name: '星野·1.60 非球面套餐', price: 1280, lensType: '1.60 非球面', frameIncluded: true },
    { id: 'p2', name: '青川·防蓝光渐进套餐', price: 1880, lensType: '1.56 防蓝光渐进', frameIncluded: true },
    { id: 'p3', name: '松雪·1.74 高折射套餐', price: 2680, lensType: '1.74 高折射', frameIncluded: false },
  ],
  orders: [
    { id: 'o1', code: 'SO250518-0017', customerId: 'c1', packageId: 'p1', createdAt: '2025-05-18 10:24', status: 'in_workshop', store: '南京·新街口旗舰店', salesperson: '田也' },
    { id: 'o2', code: 'SO250519-0028', customerId: 'c2', packageId: 'p2', createdAt: '2025-05-19 14:02', status: 'quality_check', store: '南京·新街口旗舰店', salesperson: '田也' },
    { id: 'o3', code: 'SO250520-0035', customerId: 'c3', packageId: 'p3', createdAt: '2025-05-20 11:18', status: 'redeemed', store: '南京·新街口旗舰店', salesperson: '田也' },
    { id: 'o4', code: 'SO250521-0042', customerId: 'c1', packageId: 'p1', createdAt: '2025-05-21 16:47', status: 'pending', store: '南京·新街口旗舰店', salesperson: '林岚' },
  ],
  rxList: [
    {
      orderId: 'o1', measuredBy: '周知野', measuredAt: '2025-05-18 10:38',
      od: { sphere: -4.5, cylinder: -0.75, axis: 175 },
      os: { sphere: -4.25, cylinder: -0.5, axis: 5 },
      pd: 62,
      note: '顾客久盯屏幕，建议防蓝光；鼻托偏紧，需调整。',
    },
    {
      orderId: 'o2', measuredBy: '周知野', measuredAt: '2025-05-19 14:22',
      od: { sphere: -2.0, cylinder: -0.5, axis: 90, add: 1.5 },
      os: { sphere: -1.75, cylinder: -0.25, axis: 85, add: 1.5 },
      pd: 63,
      note: '渐进定制，ADD 1.50 已确认。',
    },
    {
      orderId: 'o3', measuredBy: '周知野', measuredAt: '2025-05-20 11:42',
      od: { sphere: -7.0, cylinder: -1.25, axis: 10 },
      os: { sphere: -6.75, cylinder: -1.0, axis: 170 },
      pd: 61,
    },
  ],
  jobs: [
    { id: 'j1', orderId: 'o1', stage: 'cutting', updatedAt: '2025-05-21 09:12', assignee: '陈默' },
    { id: 'j2', orderId: 'o2', stage: 'quality', updatedAt: '2025-05-21 08:50', assignee: '陈默' },
    { id: 'j3', orderId: 'o3', stage: 'done', updatedAt: '2025-05-20 18:02', assignee: '陈默' },
  ],
  transfers: [
    {
      id: 't1', orderId: 'o1', fromStore: '上海·仓库', toStore: '中央加工中心',
      logistics: '顺丰速运', trackingNo: 'SF11992233', status: 'lost',
      sentAt: '2025-05-20 10:02', lost: true,
      note: '物流显示签收但加工未收到，仓库与门店已确认丢失。',
      operator: '陈默',
      lostConfirmedBy: '陈默',
    },
  ],
  repairs: [
    {
      id: 'r1', orderId: 'o2', reason: '镜腿镀层脱落', owner: '陈默',
      eta: '2025-05-23', status: 'factory', createdAt: '2025-05-20 16:20',
      note: '顾客反馈使用 3 天出现镀层问题，附柜台照片。',
    },
  ],
  refunds: [
    {
      id: 'rf1', orderId: 'o1', amount: 1280, reason: '镜片调拨丢失，顾客要求退单重配',
      status: 'reviewing', requestedBy: '苏芮', requestedAt: '2025-05-21 10:05',
    },
  ],
  notes: [
    { id: 'n1', orderId: 'o1', kind: 'note', role: 'optometrist', actor: '周知野', content: '首次验光：顾客主诉视物疲劳，矫正视力 1.0。', createdAt: '2025-05-18 10:40' },
    { id: 'n2', orderId: 'o1', kind: 'note', role: 'workshop', actor: '陈默', content: '已打印加工单，待 1.60 非球面镜片到位。', createdAt: '2025-05-19 09:15' },
    { id: 'n3', orderId: 'o1', kind: 'evidence', role: 'workshop', actor: '陈默', content: '物流签收单（加工未收到），已同步仓库。', createdAt: '2025-05-20 17:35', attach: '签收单.jpg' },
    { id: 'n4', orderId: 'o1', kind: 'reject', role: 'manager', actor: '林岚', content: '初次退款申请信息不全，需附物流异常与顾客沟通录音。', createdAt: '2025-05-21 09:20' },
    { id: 'n5', orderId: 'o1', kind: 'supplement', role: 'service', actor: '苏芮', content: '补录：顺丰客服记录、顾客电话沟通摘要。', createdAt: '2025-05-21 09:58' },
    { id: 'n6', orderId: 'o1', kind: 'note', role: 'service', actor: '苏芮', content: '顾客同意退单后于下周重新到店配镜。', createdAt: '2025-05-21 10:02' },
    { id: 'n7', orderId: 'o2', kind: 'note', role: 'workshop', actor: '陈默', content: '渐进片已下厂，预计 5/23 回店。', createdAt: '2025-05-20 15:02' },
    { id: 'n8', orderId: 'o2', kind: 'note', role: 'workshop', actor: '陈默', content: '镜腿镀层脱落拍照取证，送厂返修。', createdAt: '2025-05-20 16:22' },
  ],
}
