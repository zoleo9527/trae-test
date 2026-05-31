import type { StatusHistory } from '~/types'

export const mockStatusHistory: StatusHistory[] = [
  {
    id: 'sh-001',
    recordId: 'patrol-001',
    fromStatus: null,
    toStatus: 'draft',
    operatorId: 'user-002',
    operatorName: '李教练',
    remark: '创建巡场记录',
    createdAt: '2024-05-20T10:30:00+08:00'
  },
  {
    id: 'sh-002',
    recordId: 'patrol-001',
    fromStatus: 'draft',
    toStatus: 'pending',
    operatorId: 'user-002',
    operatorName: '李教练',
    remark: '提交巡场记录，等待经理审核',
    createdAt: '2024-05-20T12:00:00+08:00'
  },
  {
    id: 'sh-003',
    recordId: 'patrol-001',
    fromStatus: 'pending',
    toStatus: 'approved',
    operatorId: 'user-001',
    operatorName: '张明远',
    remark: '审核通过，问题已转相关部门处理',
    createdAt: '2024-05-20T17:00:00+08:00'
  },
  {
    id: 'sh-004',
    recordId: 'complaint-001',
    fromStatus: null,
    toStatus: 'pending',
    operatorId: 'user-003',
    operatorName: '王前台',
    remark: '客户投诉登记，等待分配处理人',
    createdAt: '2024-05-21T09:30:00+08:00'
  },
  {
    id: 'sh-005',
    recordId: 'complaint-001',
    fromStatus: 'pending',
    toStatus: 'processing',
    operatorId: 'user-001',
    operatorName: '张明远',
    remark: '分配给李教练处理',
    createdAt: '2024-05-21T10:00:00+08:00'
  },
  {
    id: 'sh-006',
    recordId: 'complaint-001',
    fromStatus: 'processing',
    toStatus: 'completed',
    operatorId: 'user-002',
    operatorName: '李教练',
    remark: '投诉已解决，客户满意',
    createdAt: '2024-05-21T14:30:00+08:00'
  },
  {
    id: 'sh-007',
    recordId: 'patrol-002',
    fromStatus: null,
    toStatus: 'draft',
    operatorId: 'user-002',
    operatorName: '李教练',
    remark: '创建巡场记录',
    createdAt: '2024-05-22T08:30:00+08:00'
  },
  {
    id: 'sh-008',
    recordId: 'patrol-002',
    fromStatus: 'draft',
    toStatus: 'pending',
    operatorId: 'user-002',
    operatorName: '李教练',
    remark: '提交审核',
    createdAt: '2024-05-22T08:45:00+08:00'
  },
  {
    id: 'sh-009',
    recordId: 'patrol-002',
    fromStatus: 'pending',
    toStatus: 'rejected',
    operatorId: 'user-001',
    operatorName: '张明远',
    remark: '沙坑问题描述不够详细，请补充具体位置和影响范围，并附上照片。',
    createdAt: '2024-05-22T09:30:00+08:00'
  },
  {
    id: 'sh-010',
    recordId: 'complaint-002',
    fromStatus: null,
    toStatus: 'pending',
    operatorId: 'user-003',
    operatorName: '王前台',
    remark: '客户投诉沙坑维护不及时',
    createdAt: '2024-05-22T10:00:00+08:00'
  },
  {
    id: 'sh-011',
    recordId: 'complaint-002',
    fromStatus: 'pending',
    toStatus: 'processing',
    operatorId: 'user-001',
    operatorName: '张明远',
    remark: '已分配，与巡场问题PAT-2024-0522-001并案处理',
    createdAt: '2024-05-22T10:15:00+08:00'
  },
  {
    id: 'sh-012',
    recordId: 'booking-001',
    fromStatus: null,
    toStatus: 'pending',
    operatorId: 'user-003',
    operatorName: '王前台',
    remark: '预约创建，等待支付',
    createdAt: '2024-05-20T14:00:00+08:00'
  },
  {
    id: 'sh-013',
    recordId: 'booking-001',
    fromStatus: 'pending',
    toStatus: 'approved',
    operatorId: 'user-003',
    operatorName: '王前台',
    remark: '储值卡扣款成功，预约确认',
    createdAt: '2024-05-20T14:05:00+08:00'
  },
  {
    id: 'sh-014',
    recordId: 'booking-001',
    fromStatus: 'approved',
    toStatus: 'completed',
    operatorId: 'user-003',
    operatorName: '王前台',
    remark: '客户已离场，结算完成',
    createdAt: '2024-05-20T16:30:00+08:00'
  }
]
