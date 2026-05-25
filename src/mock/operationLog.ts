import type { OperationLog } from '@/types'

export const mockOperationLogs: OperationLog[] = [
  {
    id: '1',
    operator: '张馆长',
    operateTime: '2024-05-01 09:30:00',
    module: '展品借调',
    action: '创建借调单',
    targetId: '1',
    targetType: 'borrow',
    afterChange: '借调单JD20240501001已创建'
  },
  {
    id: '2',
    operator: '李主任',
    operateTime: '2024-05-02 14:20:00',
    module: '展品借调',
    action: '对方馆确认',
    targetId: '1',
    targetType: 'borrow',
    beforeChange: '状态：待确认',
    afterChange: '状态：对方馆已确认'
  },
  {
    id: '3',
    operator: '系统自动检测',
    operateTime: '2024-05-21 08:00:00',
    module: '异常管理',
    action: '异常触发',
    targetId: '1',
    targetType: 'exception',
    afterChange: '异常EXC20240520001已生成：展品逾期未归还'
  },
  {
    id: '4',
    operator: '活动执行-小王',
    operateTime: '2024-05-21 08:30:00',
    module: '异常管理',
    action: '领取异常',
    targetId: '1',
    targetType: 'exception',
    beforeChange: '状态：待处理',
    afterChange: '状态：处理中，处理人：活动执行-小王'
  },
  {
    id: '5',
    operator: '活动执行-小王',
    operateTime: '2024-05-21 09:15:00',
    module: '异常管理',
    action: '添加处理记录',
    targetId: '1',
    targetType: 'exception',
    afterChange: '联系运输方确认位置'
  },
  {
    id: '6',
    operator: '票务专员-小张',
    operateTime: '2024-05-20 17:30:00',
    module: '异常管理',
    action: '手动登记异常',
    targetId: '2',
    targetType: 'exception',
    afterChange: '异常EXC20240520002已登记：核销数量与台账不符'
  },
  {
    id: '7',
    operator: '保管员-老周',
    operateTime: '2024-05-21 07:30:00',
    module: '异常管理',
    action: '手动登记异常',
    targetId: '4',
    targetType: 'exception',
    afterChange: '异常EXC20240520004已登记：展品状态与实际位置不符'
  },
  {
    id: '8',
    operator: '票务专员-小李',
    operateTime: '2024-05-20 09:15:00',
    module: '票务核销',
    action: '核销票务',
    targetId: '1',
    targetType: 'ticket',
    afterChange: '票号TK20240520001-001已核销'
  },
  {
    id: '9',
    operator: '布展组长-老郑',
    operateTime: '2024-05-20 16:00:00',
    module: '异常管理',
    action: '异常解决',
    targetId: '5',
    targetType: 'exception',
    beforeChange: '状态：处理中',
    afterChange: '状态：已解决'
  }
]
