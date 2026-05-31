import type {
  User, Project, Staff, Schedule, PunchRecord, QualityInspection, Supply, SupplyRequisition, Alert, RectificationRecord
} from '~/types'

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: '张明',
    role: 'project_manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zm',
    phone: '13800138001'
  },
  {
    id: 'user-2',
    name: '李华',
    role: 'scheduling_specialist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lh',
    phone: '13800138002'
  },
  {
    id: 'user-3',
    name: '王芳',
    role: 'quality_inspector',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wf',
    phone: '13800138003'
  }
]

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: '国贸中心写字楼',
    address: '北京市朝阳区建国门外大街1号',
    clientName: '国贸物业',
    clientPhone: '13900139001',
    contractStartDate: '2025-01-01',
    contractEndDate: '2026-12-31',
    status: 'active',
    weeklyCleaningDays: 7,
    assignedStaff: ['staff-1', 'staff-2', 'staff-3'],
    note: '甲级写字楼，每日清洁要求高'
  },
  {
    id: 'proj-2',
    name: '万达广场购物中心',
    address: '北京市朝阳区建国路88号',
    clientName: '万达商业',
    clientPhone: '13900139002',
    contractStartDate: '2025-03-15',
    contractEndDate: '2026-06-30',
    status: 'expiring',
    weeklyCleaningDays: 7,
    assignedStaff: ['staff-4', 'staff-5', 'staff-6'],
    note: '大型购物中心，人流量大'
  },
  {
    id: 'proj-3',
    name: '中关村科技园办公楼',
    address: '北京市海淀区中关村大街1号',
    clientName: '科技园管理公司',
    clientPhone: '13900139003',
    contractStartDate: '2025-02-01',
    contractEndDate: '2026-05-15',
    status: 'expiring',
    weeklyCleaningDays: 5,
    assignedStaff: ['staff-7', 'staff-8'],
    note: '科技园区，工作日清洁'
  },
  {
    id: 'proj-4',
    name: '亦庄工业园区',
    address: '北京市大兴区亦庄经济技术开发区',
    clientName: '亦庄工业园',
    clientPhone: '13900139004',
    contractStartDate: '2024-06-01',
    contractEndDate: '2026-12-31',
    status: 'active',
    weeklyCleaningDays: 6,
    assignedStaff: ['staff-9', 'staff-10'],
    note: '工业园区，有特殊清洁要求'
  }
]

export const mockStaff: Staff[] = [
  { id: 'staff-1', name: '赵大姐', phone: '13700137001', position: 'cleaner', hireDate: '2023-05-15', status: 'active', projects: ['proj-1'] },
  { id: 'staff-2', name: '钱阿姨', phone: '13700137002', position: 'cleaner', hireDate: '2023-06-20', status: 'active', projects: ['proj-1'] },
  { id: 'staff-3', name: '孙哥', phone: '13700137003', position: 'supervisor', hireDate: '2022-03-10', status: 'active', projects: ['proj-1'] },
  { id: 'staff-4', name: '李姐', phone: '13700137004', position: 'cleaner', hireDate: '2024-01-15', status: 'active', projects: ['proj-2'] },
  { id: 'staff-5', name: '周阿姨', phone: '13700137005', position: 'cleaner', hireDate: '2024-02-20', status: 'active', projects: ['proj-2'] },
  { id: 'staff-6', name: '吴师傅', phone: '13700137006', position: 'supervisor', hireDate: '2023-08-05', status: 'active', projects: ['proj-2'] },
  { id: 'staff-7', name: '郑姐', phone: '13700137007', position: 'cleaner', hireDate: '2023-11-10', status: 'active', projects: ['proj-3'] },
  { id: 'staff-8', name: '王哥', phone: '13700137008', position: 'supervisor', hireDate: '2022-12-01', status: 'active', projects: ['proj-3'] },
  { id: 'staff-9', name: '冯姐', phone: '13700137009', position: 'cleaner', hireDate: '2024-03-15', status: 'active', projects: ['proj-4'] },
  { id: 'staff-10', name: '陈哥', phone: '13700137010', position: 'supervisor', hireDate: '2023-04-20', status: 'active', projects: ['proj-4'] }
]

export const generateMockSchedules = (): Schedule[] => {
  const schedules: Schedule[] = []
  const today = new Date()
  
  for (let i = -7; i <= 14; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      mockProjects.forEach((project, pIdx) => {
        const staffCount = Math.min(project.assignedStaff.length, 3)
        for (let s = 0; s < staffCount; s++) {
          const staffId = project.assignedStaff[s]
          const isWeekend = dayOfWeek === 6 || dayOfWeek === 0
          const startTime = isWeekend ? '09:00' : '08:00'
          const endTime = isWeekend ? '17:00' : '16:00'
          
          let status: Schedule['status'] = 'scheduled'
          if (i < 0) {
            status = Math.random() > 0.05 ? 'completed' : 'cancelled'
          } else if (i === 0) {
            status = 'in_progress'
          }
          
          schedules.push({
            id: `sched-${dateStr}-${project.id}-${s}`,
            projectId: project.id,
            staffId,
            date: dateStr,
            startTime,
            endTime,
            taskType: i % 3 === 0 ? 'deep' : 'daily',
            status,
            note: ''
          })
        }
      })
    }
  }
  
  schedules[3].status = 'cancelled'
  schedules[3].note = '员工请假，已安排替班'
  
  return schedules
}

export const mockSchedules = generateMockSchedules()

export const generateMockPunchRecords = (): PunchRecord[] => {
  const records: PunchRecord[] = []
  
  mockSchedules.forEach(schedule => {
    if (schedule.status === 'scheduled') return
    
    const isAbsent = schedule.id.endsWith('-proj-2-0') && schedule.date.endsWith('-28')
    
    let checkInTime: string | null = null
    let checkOutTime: string | null = null
    let status: PunchRecord['status'] = 'pending'
    
    if (schedule.status === 'completed') {
      const baseHour = parseInt(schedule.startTime.split(':')[0])
      const checkInHour = baseHour + Math.floor(Math.random() * 2)
      const checkInMin = Math.floor(Math.random() * 30)
      checkInTime = `${checkInHour.toString().padStart(2, '0')}:${checkInMin.toString().padStart(2, '0')}`
      
      const endHour = parseInt(schedule.endTime.split(':')[0])
      const checkOutHour = endHour + Math.floor(Math.random() * 2)
      const checkOutMin = Math.floor(Math.random() * 30)
      checkOutTime = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMin.toString().padStart(2, '0')}`
      
      if (isAbsent) {
        checkInTime = null
        checkOutTime = null
        status = 'absent'
      } else if (checkInHour > baseHour) {
        status = 'late'
      } else if (checkOutHour < endHour) {
        status = 'early_leave'
      } else {
        status = 'normal'
      }
    } else if (schedule.status === 'in_progress') {
      checkInTime = schedule.startTime
      status = 'pending'
    }
    
    records.push({
      id: `punch-${schedule.id}`,
      scheduleId: schedule.id,
      projectId: schedule.projectId,
      staffId: schedule.staffId,
      date: schedule.date,
      checkInTime,
      checkOutTime,
      checkInPhoto: checkInTime ? `https://picsum.photos/200/300?random=${schedule.id}` : null,
      checkOutPhoto: checkOutTime ? `https://picsum.photos/200/300?random=${schedule.id}-out` : null,
      status,
      locationVerified: !isAbsent,
      note: status === 'absent' ? '未打卡，需核实' : ''
    })
  })
  
  const missingPunch = records.find(r => r.status === 'absent')
  if (missingPunch) {
    missingPunch.note = '员工无故缺勤，已通知主管'
  }
  
  return records
}

export const mockPunchRecords = generateMockPunchRecords()

export const mockSupplies: Supply[] = [
  { id: 'supply-1', name: '全能清洁剂', category: 'detergent', unit: '瓶', currentStock: 45, safeStock: 30, warningStock: 10, lastRestockDate: '2026-05-20', lastRestockQuantity: 50, unitPrice: 28.5, supplier: '清洁用品批发', note: '日常清洁必备' },
  { id: 'supply-2', name: '玻璃清洁剂', category: 'detergent', unit: '瓶', currentStock: 12, safeStock: 20, warningStock: 5, lastRestockDate: '2026-05-15', lastRestockQuantity: 30, unitPrice: 35.0, supplier: '清洁用品批发', note: '' },
  { id: 'supply-3', name: '地板蜡水', category: 'detergent', unit: '桶', currentStock: 8, safeStock: 15, warningStock: 3, lastRestockDate: '2026-05-10', lastRestockQuantity: 20, unitPrice: 120.0, supplier: '清洁用品批发', note: '' },
  { id: 'supply-4', name: '拖把', category: 'tool', unit: '把', currentStock: 25, safeStock: 20, warningStock: 5, lastRestockDate: '2026-05-25', lastRestockQuantity: 30, unitPrice: 45.0, supplier: '清洁工具专营', note: '' },
  { id: 'supply-5', name: '清洁布', category: 'tool', unit: '块', currentStock: 3, safeStock: 50, warningStock: 10, lastRestockDate: '2026-04-28', lastRestockQuantity: 100, unitPrice: 8.5, supplier: '清洁工具专营', note: '库存严重不足' },
  { id: 'supply-6', name: '垃圾袋（大)', category: 'disposable', unit: '卷', currentStock: 150, safeStock: 100, warningStock: 20, lastRestockDate: '2026-05-22', lastRestockQuantity: 200, unitPrice: 15.0, supplier: '一次性用品批发', note: '' },
  { id: 'supply-7', name: '卫生纸', category: 'disposable', unit: '提', currentStock: 20, safeStock: 50, warningStock: 10, lastRestockDate: '2026-05-18', lastRestockQuantity: 60, unitPrice: 25.0, supplier: '一次性用品批发', note: '' },
  { id: 'supply-8', name: '洗手液', category: 'disposable', unit: '瓶', currentStock: 8, safeStock: 30, warningStock: 5, lastRestockDate: '2026-05-05', lastRestockQuantity: 40, unitPrice: 18.0, supplier: '一次性用品批发', note: '' },
  { id: 'supply-9', name: '一次性手套', category: 'protective', unit: '盒', currentStock: 5, safeStock: 20, warningStock: 5, lastRestockDate: '2026-04-30', lastRestockQuantity: 30, unitPrice: 12.0, supplier: '防护用品专营', note: '' },
  { id: 'supply-10', name: '口罩', category: 'protective', unit: '盒', currentStock: 2, safeStock: 30, warningStock: 10, lastRestockDate: '2026-04-20', lastRestockQuantity: 50, unitPrice: 20.0, supplier: '防护用品专营', note: '库存预警' }
]

export const mockRequisitions: SupplyRequisition[] = [
  {
    id: 'req-1',
    projectId: 'proj-1',
    applicantId: 'staff-3',
    applicationDate: '2026-05-20',
    items: [
      { supplyId: 'supply-1', supplyName: '全能清洁剂', quantity: 20, deliveredQuantity: 20, unitPrice: 28.5 }
    ],
    status: 'completed',
    approverId: 'user-1',
    approvalDate: '2026-05-21',
    deliveryDate: '2026-05-22',
    rejectReason: null,
    note: '月度常规补货'
  },
  {
    id: 'req-2',
    projectId: 'proj-2',
    applicantId: 'staff-6',
    applicationDate: '2026-05-25',
    items: [
      { supplyId: 'supply-2', supplyName: '玻璃清洁剂', quantity: 15, deliveredQuantity: 15, unitPrice: 35.0 },
      { supplyId: 'supply-6', supplyName: '垃圾袋', quantity: 50, deliveredQuantity: 50, unitPrice: 15.0 }
    ],
    status: 'delivered',
    approverId: 'user-1',
    approvalDate: '2026-05-26',
    deliveryDate: '2026-05-27',
    rejectReason: null,
    note: '购物中心客流量大，消耗快'
  },
  {
    id: 'req-3',
    projectId: 'proj-3',
    applicantId: 'staff-8',
    applicationDate: '2026-05-28',
    items: [
      { supplyId: 'supply-5', supplyName: '清洁布', quantity: 30, deliveredQuantity: null, unitPrice: null },
      { supplyId: 'supply-10', supplyName: '口罩', quantity: 20, deliveredQuantity: null, unitPrice: null }
    ],
    status: 'pending',
    approverId: null,
    approvalDate: null,
    deliveryDate: null,
    rejectReason: null,
    note: '紧急补货，库存不足'
  },
  {
    id: 'req-4',
    projectId: 'proj-4',
    applicantId: 'staff-10',
    applicationDate: '2026-05-27',
    items: [
      { supplyId: 'supply-3', supplyName: '地板蜡水', quantity: 10, deliveredQuantity: null, unitPrice: null },
      { supplyId: 'supply-7', supplyName: '卫生纸', quantity: 30, deliveredQuantity: null, unitPrice: null }
    ],
    status: 'approved',
    approverId: 'user-1',
    approvalDate: '2026-05-28',
    deliveryDate: null,
    rejectReason: null,
    note: '月度清洁计划'
  },
  {
    id: 'req-5',
    projectId: 'proj-1',
    applicantId: 'staff-3',
    applicationDate: '2026-05-26',
    items: [
      { supplyId: 'supply-9', supplyName: '一次性手套', quantity: 15, deliveredQuantity: null, unitPrice: null }
    ],
    status: 'rejected',
    approverId: 'user-1',
    approvalDate: '2026-05-26',
    deliveryDate: null,
    rejectReason: '库存还有，下月再申请',
    note: ''
  }
]

export const mockInspections: QualityInspection[] = [
  {
    id: 'inspect-1',
    projectId: 'proj-1',
    inspectorId: 'user-3',
    date: '2026-05-20',
    score: 92,
    items: [
      { name: '大堂清洁', score: 18, maxScore: 20, passed: true, note: '整体良好' },
      { name: '卫生间清洁', score: 19, maxScore: 20, passed: true, note: '无异味' },
      { name: '电梯清洁', score: 17, maxScore: 20, passed: true, note: '玻璃有轻微水迹' },
      { name: '垃圾清运', score: 20, maxScore: 20, passed: true, note: '' },
      { name: '消毒工作', score: 18, maxScore: 20, passed: true, note: '' }
    ],
    overallStatus: 'excellent',
    photos: ['https://picsum.photos/400/300?random=ins1'],
    rectificationRequired: false,
    rectificationDeadline: null,
    rectificationStatus: 'none',
    note: '整体优秀，继续保持'
  },
  {
    id: 'inspect-2',
    projectId: 'proj-2',
    inspectorId: 'user-3',
    date: '2026-05-22',
    score: 75,
    items: [
      { name: '公共区域清洁', score: 15, maxScore: 20, passed: true, note: '地面有污渍' },
      { name: '卫生间清洁', score: 12, maxScore: 20, passed: false, note: '有异味，地面湿滑' },
      { name: '电梯清洁', score: 16, maxScore: 20, passed: true, note: '' },
      { name: '垃圾清运', score: 16, maxScore: 20, passed: true, note: '' },
      { name: '消毒工作', score: 16, maxScore: 20, passed: true, note: '' }
    ],
    overallStatus: 'pass',
    photos: ['https://picsum.photos/400/300?random=ins2'],
    rectificationRequired: true,
    rectificationDeadline: '2026-05-25',
    rectificationStatus: 'completed',
    note: '卫生间需要重点整改'
  },
  {
    id: 'inspect-3',
    projectId: 'proj-3',
    inspectorId: 'user-3',
    date: '2026-05-25',
    score: 68,
    items: [
      { name: '办公室清洁', score: 14, maxScore: 20, passed: true, note: '桌面有灰尘' },
      { name: '会议室清洁', score: 10, maxScore: 20, passed: false, note: '玻璃不干净' },
      { name: '公共区域', score: 15, maxScore: 20, passed: true, note: '' },
      { name: '卫生间清洁', score: 14, maxScore: 20, passed: true, note: '' },
      { name: '消毒工作', score: 15, maxScore: 20, passed: true, note: '' }
    ],
    overallStatus: 'fail',
    photos: ['https://picsum.photos/400/300?random=ins3'],
    rectificationRequired: true,
    rectificationDeadline: '2026-05-30',
    rectificationStatus: 'overdue',
    note: '会议室玻璃清洁不到位，需立即整改'
  },
  {
    id: 'inspect-4',
    projectId: 'proj-4',
    inspectorId: 'user-3',
    date: '2026-05-28',
    score: 85,
    items: [
      { name: '生产车间清洁', score: 17, maxScore: 20, passed: true, note: '' },
      { name: '办公区清洁', score: 18, maxScore: 20, passed: true, note: '' },
      { name: '仓库清洁', score: 16, maxScore: 20, passed: true, note: '' },
      { name: '卫生间清洁', score: 17, maxScore: 20, passed: true, note: '' },
      { name: '消毒工作', score: 17, maxScore: 20, passed: true, note: '' }
    ],
    overallStatus: 'good',
    photos: ['https://picsum.photos/400/300?random=ins4'],
    rectificationRequired: false,
    rectificationDeadline: null,
    rectificationStatus: 'none',
    note: '良好，保持'
  }
]

export const mockRectifications: RectificationRecord[] = [
  {
    id: 'rect-1',
    inspectionId: 'inspect-2',
    projectId: 'proj-2',
    deadline: '2026-05-25',
    status: 'completed',
    items: [
      { description: '卫生间异味处理', completed: true, completedDate: '2026-05-24', note: '已完成' },
      { description: '地面防滑处理', completed: true, completedDate: '2026-05-24', note: '已铺设防滑垫' }
    ],
    assigneeId: 'staff-6',
    completedDate: '2026-05-24',
    photos: ['https://picsum.photos/400/300?random=rect1'],
    note: '整改完成，已复查'
  },
  {
    id: 'rect-2',
    inspectionId: 'inspect-3',
    projectId: 'proj-3',
    deadline: '2026-05-30',
    status: 'overdue',
    items: [
      { description: '会议室玻璃清洁', completed: false, completedDate: null, note: '' },
      { description: '桌面灰尘清洁', completed: true, completedDate: '2026-05-29', note: '已完成' }
    ],
    assigneeId: 'staff-8',
    completedDate: null,
    photos: [],
    note: '玻璃清洁尚未完成'
  }
]

export const generateMockAlerts = (): Alert[] => {
  const alerts: Alert[] = []
  const now = new Date().toISOString()
  
  const missingPunch = mockPunchRecords.find(p => p.status === 'absent')
  if (missingPunch) {
    alerts.push({
      id: 'alert-1',
      type: 'missing_punch',
      severity: 'critical',
      status: 'open',
      title: '员工缺勤未打卡',
      description: `员工 ${mockStaff.find(s => s.id === missingPunch.staffId)?.name} 在 ${missingPunch.date} 未打卡，需立即核实处理`,
      relatedId: missingPunch.id,
      relatedType: 'punch',
      projectId: missingPunch.projectId,
      assigneeId: 'user-1',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: 'open',
        note: '系统自动检测',
        operatorId: 'system',
        timestamp: now
      }]
    })
  }
  
  const lowStockSupplies = mockSupplies.filter(s => s.currentStock <= s.warningStock)
  lowStockSupplies.forEach((supply, idx) => {
    alerts.push({
      id: `alert-stock-${idx}`,
      type: 'low_stock',
      severity: supply.currentStock <= 2 ? 'critical' : 'warning',
      status: 'open',
      title: '库存预警',
      description: `${supply.name} 库存仅剩 ${supply.currentStock}${supply.unit}，低于警戒线 ${supply.warningStock}${supply.unit}`,
      relatedId: supply.id,
      relatedType: 'supply',
      projectId: null,
      assigneeId: 'user-1',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: 'open',
        note: '库存预警自动触发',
        operatorId: 'system',
        timestamp: now
      }]
    })
  })
  
  const pendingRect = mockRectifications.filter(r => r.status === 'overdue')
  pendingRect.forEach((rect, idx) => {
    alerts.push({
      id: `alert-rect-${idx}`,
      type: 'rectification',
      severity: 'critical',
      status: 'open',
      title: '整改逾期未完成',
      description: `项目 ${mockProjects.find(p => p.id === rect.projectId)?.name} 的整改任务已逾期，请立即处理`,
      relatedId: rect.id,
      relatedType: 'rectification',
      projectId: rect.projectId,
      assigneeId: 'user-1',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: 'open',
        note: '整改逾期自动提醒',
        operatorId: 'system',
        timestamp: now
      }]
    })
  })
  
  const expiringProjects = mockProjects.filter(p => p.status === 'expiring')
  expiringProjects.forEach((project, idx) => {
    const daysLeft = Math.ceil((new Date(project.contractEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    alerts.push({
      id: `alert-contract-${idx}`,
      type: 'contract_expiry',
      severity: daysLeft <= 15 ? 'warning' : 'info',
      status: 'open',
      title: '合同即将到期',
      description: `项目 ${project.name} 的合同将于 ${project.contractEndDate} 到期，请及时续约`,
      relatedId: project.id,
      relatedType: 'project',
      projectId: project.id,
      assigneeId: 'user-1',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: 'open',
        note: '合同到期提醒',
        operatorId: 'system',
        timestamp: now
      }]
    })
  })
  
  const pendingReq = mockRequisitions.find(r => r.status === 'pending')
  if (pendingReq) {
    alerts.push({
      id: 'alert-req-1',
      type: 'overdue_task',
      severity: 'warning',
      status: 'open',
      title: '申领单待审核',
      description: `项目 ${mockProjects.find(p => p.id === pendingReq.projectId)?.name} 有新的耗材申领单待审核`,
      relatedId: pendingReq.id,
      relatedType: 'requisition',
      projectId: pendingReq.projectId,
      assigneeId: 'user-1',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolutionNote: null,
      history: [{
        status: 'open',
        note: '待办任务提醒',
        operatorId: 'system',
        timestamp: now
      }]
    })
  }
  
  return alerts
}

export const mockAlerts = generateMockAlerts()
