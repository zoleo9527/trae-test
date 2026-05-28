import { User, UserRole, Member, Product, ProductStatus, ExchangeOrder, ExchangeOrderStatus, PointsRecord, InventoryLog, Store, InspectionIssue } from '@/types'
import dayjs from 'dayjs'

export const mockStores: Store[] = [
  { id: 'S001', name: '文创旗舰店', address: '北京市朝阳区建国路88号', managerName: '张店长', managerPhone: '13800138001' },
  { id: 'S002', name: '故宫文创店', address: '北京市东城区景山前街4号', managerName: '李店长', managerPhone: '13800138002' },
  { id: 'S003', name: '上海分店', address: '上海市黄浦区南京东路100号', managerName: '王店长', managerPhone: '13800138003' }
]

export const mockUsers: User[] = [
  { id: 'U001', name: '张店长', role: UserRole.STORE_MANAGER, storeId: 'S001', avatar: '👨‍💼' },
  { id: 'U002', name: '李企划', role: UserRole.PLANNER, avatar: '👩‍💻' },
  { id: 'U003', name: '王仓管', role: UserRole.WAREHOUSE, avatar: '👷' },
  { id: 'U004', name: '刘店长', role: UserRole.STORE_MANAGER, storeId: 'S002', avatar: '👩‍💼' }
]

export const mockMembers: Member[] = [
  { id: 'M001', name: '王小明', phone: '13900139001', level: '金卡', totalPoints: 15800, availablePoints: 8500, frozenPoints: 2000, registerDate: '2023-06-15', lastConsumeDate: '2024-01-10', storeId: 'S001' },
  { id: 'M002', name: '李小红', phone: '13900139002', level: '钻石', totalPoints: 52000, availablePoints: 35600, frozenPoints: 0, registerDate: '2022-03-20', lastConsumeDate: '2024-01-12', storeId: 'S001' },
  { id: 'M003', name: '张小华', phone: '13900139003', level: '银卡', totalPoints: 6500, availablePoints: 4200, frozenPoints: 500, registerDate: '2023-09-01', lastConsumeDate: '2024-01-08', storeId: 'S002' },
  { id: 'M004', name: '赵大伟', phone: '13900139004', level: '普通', totalPoints: 2100, availablePoints: 2100, frozenPoints: 0, registerDate: '2024-01-01', lastConsumeDate: '2024-01-05', storeId: 'S001' },
  { id: 'M005', name: '陈美丽', phone: '13900139005', level: '金卡', totalPoints: 28000, availablePoints: 12000, frozenPoints: 3000, registerDate: '2023-02-14', lastConsumeDate: '2024-01-11', storeId: 'S003' }
]

export const mockProducts: Product[] = [
  { id: 'P001', name: '故宫联名书签套装', code: 'CP-001', category: '文具', pointsRequired: 2000, stock: 150, lockedStock: 20, availableStock: 130, isCoBranded: true, coBrandPartner: '故宫博物院', status: ProductStatus.ON_SHELF, syncStatus: 'synced', lastSyncTime: '2024-01-12 10:30:00', imageUrl: '📚', description: '故宫联名限量版书签套装，包含6枚经典图案书签', createTime: '2023-12-01', updateTime: '2024-01-12' },
  { id: 'P002', name: '手账本-四季款', code: 'CP-002', category: '文具', pointsRequired: 1500, stock: 200, lockedStock: 15, availableStock: 185, isCoBranded: false, status: ProductStatus.ON_SHELF, imageUrl: '📒', description: '精美手账本，四季主题设计', createTime: '2023-11-15', updateTime: '2024-01-10' },
  { id: 'P003', name: '敦煌文创帆布袋', code: 'CP-003', category: '周边', pointsRequired: 3000, stock: 80, lockedStock: 30, availableStock: 50, isCoBranded: true, coBrandPartner: '敦煌研究院', status: ProductStatus.ON_SHELF, syncStatus: 'pending', lastSyncTime: '2024-01-11 15:00:00', imageUrl: '👜', description: '敦煌壁画艺术图案环保帆布袋', createTime: '2023-12-20', updateTime: '2024-01-11' },
  { id: 'P004', name: '青花瓷茶具套装', code: 'CP-004', category: '茶具', pointsRequired: 8000, stock: 30, lockedStock: 5, availableStock: 25, isCoBranded: false, status: ProductStatus.ON_SHELF, imageUrl: '🍵', description: '传统青花瓷工艺，一壶四杯套装', createTime: '2023-10-01', updateTime: '2024-01-05' },
  { id: 'P005', name: '熊猫公仔-限定版', code: 'CP-005', category: '玩具', pointsRequired: 5000, stock: 0, lockedStock: 0, availableStock: 0, isCoBranded: true, coBrandPartner: '成都大熊猫基地', status: ProductStatus.SYNCING, syncStatus: 'failed', lastSyncTime: '2024-01-10 09:00:00', imageUrl: '🐼', description: '成都大熊猫基地联名限定款公仔', createTime: '2023-12-25', updateTime: '2024-01-10' },
  { id: 'P006', name: '丝绸围巾-山水款', code: 'CP-006', category: '服饰', pointsRequired: 6000, stock: 45, lockedStock: 10, availableStock: 35, isCoBranded: false, status: ProductStatus.PENDING, imageUrl: '🧣', description: '100%桑蚕丝，中国山水画图案', createTime: '2024-01-08', updateTime: '2024-01-08' }
]

export const mockExchangeOrders: ExchangeOrder[] = [
  { id: 'O001', orderNo: 'EX202401120001', memberId: 'M001', memberName: '王小明', memberPhone: '13900139001', productId: 'P001', productName: '故宫联名书签套装', productImage: '📚', pointsRequired: 2000, quantity: 1, totalPoints: 2000, status: ExchangeOrderStatus.VERIFIED, storeId: 'S001', storeName: '文创旗舰店', applyTime: '2024-01-10 09:30:00', confirmTime: '2024-01-10 10:00:00', confirmBy: '张店长', shipTime: '2024-01-10 14:00:00', shipBy: '王仓管', deliverTime: '2024-01-11 09:00:00', verifyTime: '2024-01-12 15:30:00', verifyBy: '张店长', verifyCode: 'V8X2K9', currentHandler: UserRole.STORE_MANAGER, isAbnormal: false },
  { id: 'O002', orderNo: 'EX202401120002', memberId: 'M002', memberName: '李小红', memberPhone: '13900139002', productId: 'P004', productName: '青花瓷茶具套装', productImage: '🍵', pointsRequired: 8000, quantity: 1, totalPoints: 8000, status: ExchangeOrderStatus.DELIVERED, storeId: 'S001', storeName: '文创旗舰店', applyTime: '2024-01-11 11:00:00', confirmTime: '2024-01-11 11:30:00', confirmBy: '张店长', shipTime: '2024-01-11 16:00:00', shipBy: '王仓管', deliverTime: '2024-01-12 10:00:00', currentHandler: UserRole.STORE_MANAGER, isAbnormal: false },
  { id: 'O003', orderNo: 'EX202401120003', memberId: 'M003', memberName: '张小华', memberPhone: '13900139003', productId: 'P003', productName: '敦煌文创帆布袋', productImage: '👜', pointsRequired: 3000, quantity: 2, totalPoints: 6000, status: ExchangeOrderStatus.CONFIRMED, storeId: 'S002', storeName: '故宫文创店', applyTime: '2024-01-12 08:45:00', confirmTime: '2024-01-12 09:15:00', confirmBy: '刘店长', currentHandler: UserRole.WAREHOUSE, isAbnormal: false },
  { id: 'O004', orderNo: 'EX202401120004', memberId: 'M001', memberName: '王小明', memberPhone: '13900139001', productId: 'P005', productName: '熊猫公仔-限定版', productImage: '🐼', pointsRequired: 5000, quantity: 1, totalPoints: 5000, status: ExchangeOrderStatus.PENDING, storeId: 'S001', storeName: '文创旗舰店', applyTime: '2024-01-12 14:20:00', currentHandler: UserRole.STORE_MANAGER, isAbnormal: true, abnormalType: 'stock_mismatch', abnormalRemark: '库存为0但商品显示可兑换，需企划确认' },
  { id: 'O005', orderNo: 'EX202401120005', memberId: 'M005', memberName: '陈美丽', memberPhone: '13900139005', productId: 'P002', productName: '手账本-四季款', productImage: '📒', pointsRequired: 1500, quantity: 3, totalPoints: 4500, status: ExchangeOrderStatus.SHIPPED, storeId: 'S003', storeName: '上海分店', applyTime: '2024-01-09 16:00:00', confirmTime: '2024-01-09 16:30:00', confirmBy: '王店长', shipTime: '2024-01-10 10:00:00', shipBy: '王仓管', currentHandler: UserRole.STORE_MANAGER, isAbnormal: true, abnormalType: 'timeout', abnormalRemark: '物流超时，已超过48小时未送达' }
]

export const mockPointsRecords: PointsRecord[] = [
  { id: 'PR001', memberId: 'M001', memberName: '王小明', type: 'earn', amount: 500, balance: 10500, source: 'purchase', orderNo: 'PO20240110001', remark: '消费500元获得积分', operatorId: 'U001', operatorName: '张店长', storeId: 'S001', createTime: '2024-01-10 10:00:00' },
  { id: 'PR002', memberId: 'M001', memberName: '王小明', type: 'spend', amount: -2000, balance: 8500, source: 'exchange', orderNo: 'EX202401120001', remark: '兑换故宫联名书签套装', operatorId: 'U001', operatorName: '张店长', storeId: 'S001', createTime: '2024-01-10 09:30:00' },
  { id: 'PR003', memberId: 'M002', memberName: '李小红', type: 'earn', amount: 2000, balance: 43600, source: 'activity', remark: '新年活动奖励积分', operatorId: 'U002', operatorName: '李企划', storeId: 'S001', createTime: '2024-01-01 00:00:00' },
  { id: 'PR004', memberId: 'M003', memberName: '张小华', type: 'expire', amount: -300, balance: 4200, source: 'expire', remark: '2023年6月积分到期', operatorId: 'system', operatorName: '系统', storeId: 'S002', createTime: '2024-01-01 00:00:00' },
  { id: 'PR005', memberId: 'M001', memberName: '王小明', type: 'adjust', amount: 0, balance: 8500, source: 'adjust', remark: '积分调整-冻结2000积分', operatorId: 'U002', operatorName: '李企划', storeId: 'S001', createTime: '2024-01-12 14:20:00' }
]

export const mockInventoryLogs: InventoryLog[] = [
  { id: 'IL001', productId: 'P001', productName: '故宫联名书签套装', type: 'out', quantity: 1, beforeStock: 151, afterStock: 150, relatedOrderNo: 'EX202401120001', remark: '兑换出库', operatorId: 'U003', operatorName: '王仓管', storeId: 'S001', createTime: '2024-01-10 14:00:00' },
  { id: 'IL002', productId: 'P001', productName: '故宫联名书签套装', type: 'lock', quantity: 20, beforeStock: 150, afterStock: 130, relatedOrderNo: 'EX202401120004', remark: '订单锁定库存', operatorId: 'system', operatorName: '系统', storeId: 'S001', createTime: '2024-01-12 14:20:00' },
  { id: 'IL003', productId: 'P003', productName: '敦煌文创帆布袋', type: 'in', quantity: 50, beforeStock: 30, afterStock: 80, remark: '补货入库', operatorId: 'U003', operatorName: '王仓管', storeId: 'S001', createTime: '2024-01-08 10:00:00' },
  { id: 'IL004', productId: 'P005', productName: '熊猫公仔-限定版', type: 'adjust', quantity: 0, beforeStock: 10, afterStock: 0, remark: '库存盘点调整-联名商品同步偏差', operatorId: 'U002', operatorName: '李企划', storeId: 'S001', createTime: '2024-01-10 09:00:00' }
]

export const mockInspectionIssues: InspectionIssue[] = [
  { id: 'II001', storeId: 'S001', storeName: '文创旗舰店', type: 'stock', title: '熊猫公仔库存与实际不符', description: '系统显示库存10，实际盘点为0，怀疑联名商品同步问题', status: 'processing', reporterId: 'U004', reporterName: '刘店长', handlerId: 'U002', handlerName: '李企划', createTime: '2024-01-10 09:30:00', remark: '正在与联名方核对库存数据' },
  { id: 'II002', storeId: 'S002', storeName: '故宫文创店', type: 'display', title: '敦煌帆布袋陈列位置不合理', description: '联名商品陈列在角落， visibility不够', status: 'resolved', reporterId: 'U002', reporterName: '李企划', handlerId: 'U004', handlerName: '刘店长', createTime: '2024-01-08 14:00:00', resolveTime: '2024-01-09 10:00:00', remark: '已调整至入口显眼位置' },
  { id: 'II003', storeId: 'S001', storeName: '文创旗舰店', type: 'service', title: '核销流程不清晰', description: '新员工对会员兑换核销流程不熟悉', status: 'pending', reporterId: 'U001', reporterName: '张店长', createTime: '2024-01-12 11:00:00' }
]

export const generateOrderNo = () => {
  return `EX${dayjs().format('YYYYMMDD')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
}

export const generateVerifyCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
