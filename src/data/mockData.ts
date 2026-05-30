import type { Order, Batch, DamageRecord, RewashRecord, Receipt, ActivityLog } from '@/types';

const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
const d = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
const future = (hours: number) => new Date(now.getTime() + hours * 3600000).toISOString();

export const mockOrders: Order[] = [
  {
    id: 'ORD-001', orderNo: 'XJ20250530-001', storeName: '国贸旗舰店',
    customerName: '张明', garmentType: '西装', garmentDesc: '深蓝色全毛西装套装',
    status: 'sorting', assignedTo: 'factory_manager', batchId: null,
    createdAt: h(2), updatedAt: h(1), deadlineAt: future(22), isOverdue: false, isUrgent: true,
  },
  {
    id: 'ORD-002', orderNo: 'XJ20250530-002', storeName: '朝阳门店',
    customerName: '李芳', garmentType: '羽绒服', garmentDesc: '白色长款羽绒服',
    status: 'washing', assignedTo: 'factory_manager', batchId: 'BAT-001',
    createdAt: h(6), updatedAt: h(3), deadlineAt: future(18), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-003', orderNo: 'XJ20250530-003', storeName: '望京店',
    customerName: '王强', garmentType: '衬衫', garmentDesc: '白色棉质衬衫x3',
    status: 'inspecting', assignedTo: 'inspector', batchId: 'BAT-001',
    createdAt: h(8), updatedAt: h(2), deadlineAt: future(16), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-004', orderNo: 'XJ20250530-004', storeName: '三里屯店',
    customerName: '赵丽', garmentType: '大衣', garmentDesc: '驼色羊绒大衣',
    status: 'handover', assignedTo: 'store_handler', batchId: 'BAT-002',
    createdAt: h(24), updatedAt: h(4), deadlineAt: future(0), isOverdue: true, isUrgent: true,
  },
  {
    id: 'ORD-005', orderNo: 'XJ20250529-001', storeName: '中关村店',
    customerName: '陈刚', garmentType: '裙子', garmentDesc: '黑色真丝连衣裙',
    status: 'verifying', assignedTo: 'store_handler', batchId: 'BAT-002',
    createdAt: h(30), updatedAt: h(5), deadlineAt: h(6), isOverdue: true, isUrgent: true,
  },
  {
    id: 'ORD-006', orderNo: 'XJ20250529-002', storeName: '西单店',
    customerName: '刘洋', garmentType: '裤子', garmentDesc: '黑色西裤x2',
    status: 'completed', assignedTo: 'store_handler', batchId: 'BAT-003',
    createdAt: d(2), updatedAt: h(8), deadlineAt: h(10), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-007', orderNo: 'XJ20250529-003', storeName: '国贸旗舰店',
    customerName: '孙梅', garmentType: '床品', garmentDesc: '全棉四件套',
    status: 'rewashing', assignedTo: 'inspector', batchId: null,
    createdAt: d(3), updatedAt: h(6), deadlineAt: future(12), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-008', orderNo: 'XJ20250528-001', storeName: '朝阳门店',
    customerName: '周伟', garmentType: '西装', garmentDesc: '灰色条纹西装',
    status: 'damage_claim', assignedTo: 'factory_manager', batchId: 'BAT-004',
    createdAt: d(4), updatedAt: h(12), deadlineAt: h(24), isOverdue: true, isUrgent: true,
  },
  {
    id: 'ORD-009', orderNo: 'XJ20250528-002', storeName: '望京店',
    customerName: '吴静', garmentType: '窗帘', garmentDesc: '遮光窗帘x2幅',
    status: 'collected', assignedTo: 'factory_manager', batchId: null,
    createdAt: h(1), updatedAt: h(1), deadlineAt: future(48), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-010', orderNo: 'XJ20250528-003', storeName: '三里屯店',
    customerName: '郑磊', garmentType: '衬衫', garmentDesc: '粉色丝绸衬衫',
    status: 'rejected', assignedTo: 'store_handler', batchId: 'BAT-004',
    createdAt: d(3), updatedAt: h(3), deadlineAt: h(0), isOverdue: true, isUrgent: true,
  },
  {
    id: 'ORD-011', orderNo: 'XJ20250530-005', storeName: '西单店',
    customerName: '黄丹', garmentType: '大衣', garmentDesc: '卡其色风衣',
    status: 'collected', assignedTo: 'factory_manager', batchId: null,
    createdAt: h(0.5), updatedAt: h(0.5), deadlineAt: future(36), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-012', orderNo: 'XJ20250529-004', storeName: '中关村店',
    customerName: '林浩', garmentType: '羽绒服', garmentDesc: '黑色短款羽绒服',
    status: 'inspecting', assignedTo: 'inspector', batchId: 'BAT-001',
    createdAt: h(10), updatedAt: h(1), deadlineAt: future(14), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-013', orderNo: 'XJ20250527-001', storeName: '国贸旗舰店',
    customerName: '许涛', garmentType: '西装', garmentDesc: '黑色燕尾服',
    status: 'completed', assignedTo: 'store_handler', batchId: 'BAT-003',
    createdAt: d(4), updatedAt: d(1), deadlineAt: d(2), isOverdue: false, isUrgent: false,
  },
  {
    id: 'ORD-014', orderNo: 'XJ20250530-006', storeName: '朝阳门店',
    customerName: '何玲', garmentType: '裙子', garmentDesc: '红色晚礼服',
    status: 'sorting', assignedTo: 'factory_manager', batchId: null,
    createdAt: h(3), updatedAt: h(2), deadlineAt: future(20), isOverdue: false, isUrgent: true,
  },
  {
    id: 'ORD-015', orderNo: 'XJ20250529-005', storeName: '望京店',
    customerName: '宋远', garmentType: '床品', garmentDesc: '蚕丝被+枕套x2',
    status: 'washing', assignedTo: 'factory_manager', batchId: 'BAT-005',
    createdAt: h(12), updatedAt: h(4), deadlineAt: future(12), isOverdue: false, isUrgent: false,
  },
];

export const mockBatches: Batch[] = [
  {
    id: 'BAT-001', batchNo: 'PC20250530-01', washType: '干洗',
    washStartTime: h(5), washEndTime: null, status: 'washing',
    orderIds: ['ORD-002', 'ORD-003', 'ORD-012'],
  },
  {
    id: 'BAT-002', batchNo: 'PC20250530-02', washType: '水洗',
    washStartTime: h(20), washEndTime: h(6), status: 'completed',
    orderIds: ['ORD-004', 'ORD-005'],
  },
  {
    id: 'BAT-003', batchNo: 'PC20250529-01', washType: '干洗',
    washStartTime: d(2), washEndTime: d(1), status: 'completed',
    orderIds: ['ORD-006', 'ORD-013'],
  },
  {
    id: 'BAT-004', batchNo: 'PC20250528-01', washType: '特殊处理',
    washStartTime: d(3), washEndTime: d(2), status: 'completed',
    orderIds: ['ORD-008', 'ORD-010'],
  },
  {
    id: 'BAT-005', batchNo: 'PC20250530-03', washType: '手洗',
    washStartTime: h(8), washEndTime: null, status: 'washing',
    orderIds: ['ORD-015'],
  },
];

export const mockDamageRecords: DamageRecord[] = [
  {
    id: 'DMG-001', orderId: 'ORD-008', position: '袖口',
    description: '左侧袖口发现明显褪色，疑似漂白剂残留',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close+up+of+damaged+suit+cuff+with+discoloration+and+bleach+marks+on+dark+fabric+product+photo&image_size=square',
    recordedAt: h(12), recordedBy: '质检员-李明',
  },
  {
    id: 'DMG-002', orderId: 'ORD-010', position: '前襟',
    description: '前襟纽扣缺失一颗，布料有拉扯痕迹',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=close+up+of+damaged+shirt+front+with+missing+button+and+fabric+pulled+product+photo&image_size=square',
    recordedAt: h(3), recordedBy: '质检员-李明',
  },
];

export const mockRewashRecords: RewashRecord[] = [
  {
    id: 'RW-001', orderId: 'ORD-007', reason: '污渍未清',
    description: '床品中心区域仍有明显污渍，需重新处理',
    createdAt: h(6), rewashCompletedAt: null, status: 'rewashing',
  },
];

export const mockReceipts: Receipt[] = [
  {
    id: 'RCT-001', orderId: 'ORD-006', isVerified: true,
    verifiedAt: h(8), verifiedBy: '门店-王姐', isRejected: false, rejectReason: null,
  },
  {
    id: 'RCT-002', orderId: 'ORD-013', isVerified: true,
    verifiedAt: d(1), verifiedBy: '门店-张姐', isRejected: false, rejectReason: null,
  },
  {
    id: 'RCT-003', orderId: 'ORD-010', isVerified: false,
    verifiedAt: null, verifiedBy: null, isRejected: true, rejectReason: '衣物有新污渍，非送洗时存在',
  },
  {
    id: 'RCT-004', orderId: 'ORD-005', isVerified: false,
    verifiedAt: null, verifiedBy: null, isRejected: false, rejectReason: null,
  },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'LOG-001', orderId: 'ORD-010', action: '门店驳回', operator: '门店-王姐', role: 'store_handler', timestamp: h(3), detail: '衣物有新污渍，非送洗时存在，已驳回' },
  { id: 'LOG-002', orderId: 'ORD-008', action: '污损记录', operator: '质检员-李明', role: 'inspector', timestamp: h(12), detail: '左侧袖口发现明显褪色，疑似漂白剂残留' },
  { id: 'LOG-003', orderId: 'ORD-007', action: '返洗登记', operator: '质检员-李明', role: 'inspector', timestamp: h(6), detail: '床品中心区域仍有明显污渍，需重新处理' },
  { id: 'LOG-004', orderId: 'ORD-004', action: '进入交接', operator: '系统', role: 'factory_manager', timestamp: h(4), detail: '洗涤完成，进入待交接状态' },
  { id: 'LOG-005', orderId: 'ORD-005', action: '进入核验', operator: '系统', role: 'store_handler', timestamp: h(5), detail: '已送达门店，等待核验签收' },
  { id: 'LOG-006', orderId: 'ORD-006', action: '核验通过', operator: '门店-王姐', role: 'store_handler', timestamp: h(8), detail: '门店核验通过，回单完成' },
  { id: 'LOG-007', orderId: 'ORD-003', action: '进入质检', operator: '系统', role: 'inspector', timestamp: h(2), detail: '洗涤完成，进入质检环节' },
  { id: 'LOG-008', orderId: 'ORD-014', action: '收衣登记', operator: '门店-张姐', role: 'store_handler', timestamp: h(3), detail: '朝阳门店新收衣物：红色晚礼服' },
  { id: 'LOG-009', orderId: 'ORD-001', action: '分拣等待', operator: '系统', role: 'factory_manager', timestamp: h(2), detail: '国贸旗舰店西装已入库，等待分拣指派' },
  { id: 'LOG-010', orderId: 'ORD-015', action: '开始洗涤', operator: '厂长-赵工', role: 'factory_manager', timestamp: h(4), detail: '蚕丝被+枕套进入手洗批次 PC20250530-03' },
];
