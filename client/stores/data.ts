import { defineStore } from 'pinia'
import type {
  Project, Staff, Schedule, PunchRecord, QualityInspection,
  Supply, SupplyRequisition, Alert, RectificationRecord, CalendarEvent
} from '~/types'
import {
  mockProjects, mockStaff, mockSchedules, mockPunchRecords,
  mockInspections, mockSupplies, mockRequisitions, mockAlerts,
  mockRectifications
} from '~/data/mockData'
import { formatDate } from '~/utils/date'

interface DataState {
  projects: Project[]
  staff: Staff[]
  schedules: Schedule[]
  punchRecords: PunchRecord[]
  inspections: QualityInspection[]
  supplies: Supply[]
  requisitions: SupplyRequisition[]
  alerts: Alert[]
  rectifications: RectificationRecord[]
  loading: boolean
}

export const useDataStore = defineStore('data', {
  state: (): DataState => ({
    projects: mockProjects,
    staff: mockStaff,
    schedules: mockSchedules,
    punchRecords: mockPunchRecords,
    inspections: mockInspections,
    supplies: mockSupplies,
    requisitions: mockRequisitions,
    alerts: mockAlerts,
    rectifications: mockRectifications,
    loading: false
  }),

  getters: {
    getProjectById: (state) => (id: string): Project | undefined => {
      return state.projects.find(p => p.id === id)
    },

    getStaffById: (state) => (id: string): Staff | undefined => {
      return state.staff.find(s => s.id === id)
    },

    getUserById: (state) => (id: string): { id: string; name: string; role?: string; avatar?: string } | undefined => {
      const staff = state.staff.find(s => s.id === id)
      if (staff) {
        return { id: staff.id, name: staff.name, role: staff.position }
      }
      const mockUser = [
        { id: 'user-1', name: '张明', role: 'project_manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zm' },
        { id: 'user-2', name: '李华', role: 'scheduling_specialist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lh' },
        { id: 'user-3', name: '王芳', role: 'quality_inspector', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wf' }
      ].find(u => u.id === id)
      if (mockUser) {
        return mockUser
      }
      return undefined
    },

    getUserNameById: (state) => (id: string): string => {
      const staff = state.staff.find(s => s.id === id)
      if (staff) return staff.name
      const mockUser = [
        { id: 'user-1', name: '张明' },
        { id: 'user-2', name: '李华' },
        { id: 'user-3', name: '王芳' }
      ].find(u => u.id === id)
      if (mockUser) return mockUser.name
      return '未知用户'
    },

    getSchedulesByDate: (state) => (date: string): Schedule[] => {
      return state.schedules.filter(s => s.date === date)
    },

    getSchedulesByProject: (state) => (projectId: string): Schedule[] => {
      return state.schedules.filter(s => s.projectId === projectId)
    },

    getPunchRecordsByDate: (state) => (date: string): PunchRecord[] => {
      return state.punchRecords.filter(p => p.date === date)
    },

    getInspectionsByDate: (state) => (date: string): QualityInspection[] => {
      return state.inspections.filter(i => i.date === date)
    },

    getRequisitionsByStatus: (state) => (status: SupplyRequisition['status']): SupplyRequisition[] => {
      return state.requisitions.filter(r => r.status === status)
    },

    getOpenAlerts: (state): Alert[] => {
      return state.alerts.filter(a => a.status !== 'resolved').sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
    },

    getCriticalAlerts: (state): Alert[] => {
      return state.alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved')
    },

    getCalendarEvents: (state) => (startDate: string, endDate: string): CalendarEvent[] => {
      const events: CalendarEvent[] = []
      
      const schedules = state.schedules.filter(s => s.date >= startDate && s.date <= endDate)
      schedules.forEach(schedule => {
        const project = state.projects.find(p => p.id === schedule.projectId)
        const staff = state.staff.find(s => s.id === schedule.staffId)
        events.push({
          id: `sched-${schedule.id}`,
          date: schedule.date,
          type: 'schedule',
          title: `${staff?.name || '未知'} - ${project?.name || '未知项目'}`,
          description: `${schedule.startTime}-${schedule.endTime}`,
          status: schedule.status,
          color: schedule.status === 'completed' ? 'bg-green-100 border-green-500' : 
                 schedule.status === 'in_progress' ? 'bg-blue-100 border-blue-500' :
                 schedule.status === 'cancelled' ? 'bg-gray-100 border-gray-500' :
                 'bg-blue-50 border-blue-300',
          relatedId: schedule.id,
          projectId: schedule.projectId
        })
      })

      const punches = state.punchRecords.filter(p => p.date >= startDate && p.date <= endDate)
      punches.forEach(punch => {
        if (punch.status === 'absent' || punch.status === 'late' || punch.status === 'early_leave') {
          const staff = state.staff.find(s => s.id === punch.staffId)
          events.push({
            id: `punch-${punch.id}`,
            date: punch.date,
            type: 'punch',
            title: `${staff?.name || '未知'} - 打卡异常`,
            description: punch.status === 'absent' ? '缺勤' : punch.status === 'late' ? '迟到' : '早退',
            status: punch.status,
            color: punch.status === 'absent' ? 'bg-red-100 border-red-500' : 'bg-yellow-100 border-yellow-500',
            relatedId: punch.id,
            projectId: punch.projectId
          })
        }
      })

      const inspections = state.inspections.filter(i => i.date >= startDate && i.date <= endDate)
      inspections.forEach(inspection => {
        const project = state.projects.find(p => p.id === inspection.projectId)
        events.push({
          id: `inspect-${inspection.id}`,
          date: inspection.date,
          type: 'inspection',
          title: `质检 - ${project?.name || '未知项目'}`,
          description: `评分: ${inspection.score}分 - ${inspection.overallStatus}`,
          status: inspection.overallStatus,
          color: inspection.overallStatus === 'excellent' || inspection.overallStatus === 'good' ? 'bg-green-100 border-green-500' :
                 inspection.overallStatus === 'pass' ? 'bg-yellow-100 border-yellow-500' :
                 'bg-red-100 border-red-500',
          relatedId: inspection.id,
          projectId: inspection.projectId
        })
      })

      const requisitions = state.requisitions.filter(r => r.applicationDate >= startDate && r.applicationDate <= endDate)
      requisitions.forEach(req => {
        const project = state.projects.find(p => p.id === req.projectId)
        events.push({
          id: `req-${req.id}`,
          date: req.applicationDate,
          type: 'requisition',
          title: `申领 - ${project?.name || '未知项目'}`,
          description: `${req.items.length}项耗材`,
          status: req.status,
          color: req.status === 'pending' ? 'bg-yellow-100 border-yellow-500' :
                 req.status === 'approved' || req.status === 'completed' ? 'bg-green-100 border-green-500' :
                 req.status === 'rejected' ? 'bg-red-100 border-red-500' :
                 'bg-blue-100 border-blue-500',
          relatedId: req.id,
          projectId: req.projectId
        })
      })

      return events
    },

    lowStockSupplies: (state): Supply[] => {
      return state.supplies.filter(s => s.currentStock <= s.warningStock)
    },

    pendingRectifications: (state): RectificationRecord[] => {
      return state.rectifications.filter(r => r.status === 'pending' || r.status === 'overdue')
    },

    statistics: (state) => {
      const today = formatDate(new Date())
      const todaySchedules = state.schedules.filter(s => s.date === today)
      const todayPunches = state.punchRecords.filter(p => p.date === today)
      
      return {
        totalProjects: state.projects.filter(p => p.status === 'active').length,
        expiringProjects: state.projects.filter(p => p.status === 'expiring').length,
        todaySchedules: todaySchedules.length,
        todayCompleted: todaySchedules.filter(s => s.status === 'completed').length,
        todayAbsent: todayPunches.filter(p => p.status === 'absent').length,
        todayLate: todayPunches.filter(p => p.status === 'late').length,
        pendingRequisitions: state.requisitions.filter(r => r.status === 'pending').length,
        openAlerts: state.alerts.filter(a => a.status !== 'resolved').length,
        criticalAlerts: state.alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length,
        lowStockCount: state.supplies.filter(s => s.currentStock <= s.warningStock).length,
        pendingRectifications: state.rectifications.filter(r => r.status === 'pending' || r.status === 'overdue').length
      }
    }
  },

  actions: {
    async updateRequisitionStatus(requisitionId: string, status: SupplyRequisition['status'], approverId?: string, rejectReason?: string) {
      const req = this.requisitions.find(r => r.id === requisitionId)
      if (req) {
        req.status = status
        if (approverId) {
          req.approverId = approverId
          req.approvalDate = formatDate(new Date())
        }
        if (rejectReason) {
          req.rejectReason = rejectReason
        }
        
        const pendingAlert = this.alerts.find(a => a.relatedId === requisitionId && a.type === 'overdue_task')
        if (pendingAlert) {
          if (status === 'approved' || status === 'rejected') {
            pendingAlert.status = 'resolved'
            pendingAlert.updatedAt = new Date().toISOString()
            pendingAlert.resolvedAt = new Date().toISOString()
            pendingAlert.resolutionNote = status === 'approved' ? '申领单已批准' : `申领单已拒绝: ${rejectReason || ''}`
            pendingAlert.history.push({
              status: 'resolved',
              note: pendingAlert.resolutionNote,
              operatorId: approverId || 'system',
              timestamp: new Date().toISOString()
            })
          } else if (status === 'delivered') {
            pendingAlert.status = 'in_progress'
            pendingAlert.updatedAt = new Date().toISOString()
            pendingAlert.history.push({
              status: 'in_progress',
              note: '申领单已发货，等待确认收货',
              operatorId: approverId || 'system',
              timestamp: new Date().toISOString()
            })
          }
        }
        
        if (status === 'delivered') {
          req.deliveryDate = formatDate(new Date())
          req.items.forEach(item => {
            item.deliveredQuantity = item.quantity
            const supply = this.supplies.find(s => s.id === item.supplyId)
            if (supply) {
              supply.currentStock += item.quantity
              supply.lastRestockDate = formatDate(new Date())
              supply.lastRestockQuantity = item.quantity
              
              if (supply.currentStock > supply.warningStock) {
                const stockAlert = this.alerts.find(a => a.relatedId === supply.id && a.type === 'low_stock')
                if (stockAlert && stockAlert.status !== 'resolved') {
                  stockAlert.status = 'resolved'
                  stockAlert.updatedAt = new Date().toISOString()
                  stockAlert.resolvedAt = new Date().toISOString()
                  stockAlert.resolutionNote = `库存已补充到 ${supply.currentStock}${supply.unit}，恢复正常水平`
                  stockAlert.history.push({
                    status: 'resolved',
                    note: stockAlert.resolutionNote,
                    operatorId: approverId || 'system',
                    timestamp: new Date().toISOString()
                  })
                }
              }
            }
          })
        }
      }
    },

    async createRequisition(requisition: Omit<SupplyRequisition, 'id' | 'status' | 'approverId' | 'approvalDate' | 'deliveryDate' | 'rejectReason'>, status: SupplyRequisition['status'] = 'pending') {
      const newReq: SupplyRequisition = {
        ...requisition,
        id: `req-${Date.now()}`,
        status,
        approverId: null,
        approvalDate: null,
        deliveryDate: null,
        rejectReason: null
      }
      this.requisitions.unshift(newReq)
      
      if (status === 'pending') {
        const project = this.getProjectById(requisition.projectId)
        this.alerts.unshift({
          id: `alert-req-${Date.now()}`,
          type: 'overdue_task',
          severity: 'warning',
          status: 'open',
          title: '新申领单待审核',
          description: `项目 ${project?.name || '未知项目'} 有新的耗材申领单待审核，共 ${requisition.items.length} 项耗材`,
          relatedId: newReq.id,
          relatedType: 'requisition',
          projectId: requisition.projectId,
          assigneeId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedAt: null,
          resolutionNote: null,
          history: [{
            status: 'open',
            note: '申领单提交，等待审核',
            operatorId: requisition.applicantId,
            timestamp: new Date().toISOString()
          }]
        })
      }
      
      return newReq
    },

    async saveRequisitionDraft(requisition: Omit<SupplyRequisition, 'id' | 'status' | 'approverId' | 'approvalDate' | 'deliveryDate' | 'rejectReason'>) {
      return this.createRequisition(requisition, 'draft')
    },

    async updateAlertStatus(alertId: string, status: Alert['status'], note: string, operatorId: string) {
      const alert = this.alerts.find(a => a.id === alertId)
      if (alert) {
        alert.status = status
        alert.updatedAt = new Date().toISOString()
        if (status === 'resolved') {
          alert.resolvedAt = new Date().toISOString()
          alert.resolutionNote = note
        }
        alert.history.push({
          status,
          note,
          operatorId,
          timestamp: new Date().toISOString()
        })
      }
    },

    async updateRectificationItem(rectId: string, itemIndex: number, completed: boolean, note: string) {
      const rect = this.rectifications.find(r => r.id === rectId)
      if (rect && rect.items[itemIndex]) {
        rect.items[itemIndex].completed = completed
        rect.items[itemIndex].note = note
        if (completed) {
          rect.items[itemIndex].completedDate = formatDate(new Date())
        }
        
        const allCompleted = rect.items.every(item => item.completed)
        if (allCompleted) {
          rect.status = 'completed'
          rect.completedDate = formatDate(new Date())
        } else {
          rect.status = 'in_progress'
        }
      }
    },

    async updatePunchRecord(punchId: string, updates: Partial<PunchRecord>) {
      const punch = this.punchRecords.find(p => p.id === punchId)
      if (punch) {
        Object.assign(punch, updates)
        this.checkAndCreateAlertForPunch(punch)
      }
    },

    async createInspection(inspection: Omit<QualityInspection, 'id' | 'rectificationStatus'>) {
      const newInspection: QualityInspection = {
        ...inspection,
        id: `inspect-${Date.now()}`,
        rectificationStatus: inspection.rectificationRequired ? 'pending' : 'none'
      }
      this.inspections.unshift(newInspection)
      
      if (inspection.rectificationRequired && inspection.rectificationDeadline) {
        const failedItems = inspection.items.filter(item => !item.passed)
        const rectItems: RectificationRecord['items'] = failedItems.map(item => ({
          description: `${item.name} - ${item.note || '未通过质检'}`,
          completed: false,
          completedDate: null,
          note: ''
        }))
        
        const newRect: RectificationRecord = {
          id: `rect-${Date.now()}`,
          inspectionId: newInspection.id,
          projectId: inspection.projectId,
          deadline: inspection.rectificationDeadline,
          status: 'pending',
          items: rectItems,
          assigneeId: null,
          completedDate: null,
          photos: [],
          note: ''
        }
        this.rectifications.unshift(newRect)
        
        const project = this.getProjectById(inspection.projectId)
        this.alerts.unshift({
          id: `alert-rect-${Date.now()}`,
          type: 'rectification',
          severity: 'warning',
          status: 'open',
          title: '新整改任务',
          description: `项目 ${project?.name || '未知项目'} 有新的整改任务，截止日期 ${inspection.rectificationDeadline}`,
          relatedId: newRect.id,
          relatedType: 'rectification',
          projectId: inspection.projectId,
          assigneeId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedAt: null,
          resolutionNote: null,
          history: [{
            status: 'open',
            note: '质检不合格，自动生成整改任务',
            operatorId: inspection.inspectorId,
            timestamp: new Date().toISOString()
          }]
        })
      }
      
      return newInspection
    },

    async createRectification(rectification: Omit<RectificationRecord, 'id'>) {
      const newRect: RectificationRecord = {
        ...rectification,
        id: `rect-${Date.now()}`
      }
      this.rectifications.unshift(newRect)
      
      const inspection = this.inspections.find(i => i.id === rectification.inspectionId)
      if (inspection) {
        inspection.rectificationStatus = 'pending'
      }
      
      return newRect
    },

    async updateRectificationStatus(rectId: string, status: RectificationRecord['status'], assigneeId?: string) {
      const rect = this.rectifications.find(r => r.id === rectId)
      if (rect) {
        rect.status = status
        if (assigneeId) {
          rect.assigneeId = assigneeId
        }
        if (status === 'in_progress') {
          const alert = this.alerts.find(a => a.relatedId === rectId && a.type === 'rectification')
          if (alert) {
            alert.status = 'in_progress'
            alert.updatedAt = new Date().toISOString()
            alert.history.push({
              status: 'in_progress',
              note: '整改开始处理',
              operatorId: assigneeId || 'system',
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    },

    async assignRectification(rectId: string, assigneeId: string) {
      const rect = this.rectifications.find(r => r.id === rectId)
      if (rect) {
        rect.assigneeId = assigneeId
        if (rect.status === 'pending') {
          rect.status = 'in_progress'
        }
      }
    },

    async reviewRectification(rectId: string, passed: boolean, reviewerId: string, note: string) {
      const rect = this.rectifications.find(r => r.id === rectId)
      if (rect) {
        const inspection = this.inspections.find(i => i.id === rect.inspectionId)
        
        if (passed) {
          rect.status = 'completed'
          rect.completedDate = formatDate(new Date())
          if (inspection) {
            inspection.rectificationStatus = 'completed'
          }
          
          const alert = this.alerts.find(a => a.relatedId === rectId && a.type === 'rectification')
          if (alert) {
            alert.status = 'resolved'
            alert.updatedAt = new Date().toISOString()
            alert.resolvedAt = new Date().toISOString()
            alert.resolutionNote = note
            alert.history.push({
              status: 'resolved',
              note: `整改复查通过 - ${note}`,
              operatorId: reviewerId,
              timestamp: new Date().toISOString()
            })
          }
        } else {
          rect.status = 'in_progress'
          rect.items.forEach(item => {
            item.completed = false
            item.completedDate = null
          })
          if (inspection) {
            inspection.rectificationStatus = 'pending'
          }
          
          const alert = this.alerts.find(a => a.relatedId === rectId && a.type === 'rectification')
          if (alert) {
            alert.status = 'open'
            alert.updatedAt = new Date().toISOString()
            alert.history.push({
              status: 'open',
              note: `整改复查未通过，需重新整改 - ${note}`,
              operatorId: reviewerId,
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    },

    async addRectificationPhoto(rectId: string, photoUrl: string) {
      const rect = this.rectifications.find(r => r.id === rectId)
      if (rect) {
        rect.photos.push(photoUrl)
      }
    },

    async createSchedule(schedule: Omit<Schedule, 'id' | 'status'>) {
      const conflict = this.checkScheduleConflict(
        schedule.staffId,
        schedule.date,
        schedule.startTime,
        schedule.endTime
      )
      if (conflict) {
        throw new Error('该员工在该时间段已有排班')
      }

      const newSchedule: Schedule = {
        ...schedule,
        id: `sched-${Date.now()}`,
        status: 'scheduled'
      }
      this.schedules.push(newSchedule)
      return newSchedule
    },

    async updateSchedule(scheduleId: string, updates: Partial<Schedule>) {
      const schedule = this.schedules.find(s => s.id === scheduleId)
      if (schedule) {
        if (updates.staffId || updates.date || updates.startTime || updates.endTime) {
          const conflict = this.checkScheduleConflict(
            updates.staffId || schedule.staffId,
            updates.date || schedule.date,
            updates.startTime || schedule.startTime,
            updates.endTime || schedule.endTime,
            scheduleId
          )
          if (conflict) {
            throw new Error('该员工在该时间段已有排班')
          }
        }
        Object.assign(schedule, updates)
      }
    },

    async deleteSchedule(scheduleId: string) {
      const index = this.schedules.findIndex(s => s.id === scheduleId)
      if (index > -1) {
        this.schedules.splice(index, 1)
      }
    },

    checkScheduleConflict(staffId: string, date: string, startTime: string, endTime: string, excludeId?: string): boolean {
      const newStart = this.timeToMinutes(startTime)
      const newEnd = this.timeToMinutes(endTime)

      return this.schedules.some(s => {
        if (s.id === excludeId) return false
        if (s.staffId !== staffId || s.date !== date) return false
        if (s.status === 'cancelled') return false

        const existingStart = this.timeToMinutes(s.startTime)
        const existingEnd = this.timeToMinutes(s.endTime)

        return (newStart < existingEnd && newEnd > existingStart)
      })
    },

    timeToMinutes(time: string): number {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    },

    getSchedulesByWeek(startDate: string): Schedule[] {
      const dates = generateDateRange(startDate, addDays(startDate, 6))
      return this.schedules.filter(s => dates.includes(s.date))
    },

    getSchedulesByStaffAndDate(staffId: string, date: string): Schedule[] {
      return this.schedules.filter(s => s.staffId === staffId && s.date === date && s.status !== 'cancelled')
    },

    checkAndCreateAlertForPunch(punch: PunchRecord) {
      if (punch.status === 'normal' || punch.status === 'pending') {
        return
      }

      const existingAlert = this.alerts.find(a => 
        a.relatedId === punch.id && a.relatedType === 'punch' && a.status !== 'resolved'
      )
      if (existingAlert) {
        return
      }

      const staff = this.getStaffById(punch.staffId)
      const project = this.getProjectById(punch.projectId)
      
      let alertType: Alert['type'] = 'missing_punch'
      let severity: Alert['severity'] = 'warning'
      let title = ''
      let description = ''

      if (punch.status === 'absent') {
        alertType = 'missing_punch'
        severity = 'critical'
        title = `${staff?.name || '员工'} 缺勤`
        description = `${staff?.name || '员工'} 在 ${punch.date} ${project?.name || '项目'} 缺勤，未打卡`
      } else if (punch.status === 'late') {
        alertType = 'missing_punch'
        severity = 'warning'
        title = `${staff?.name || '员工'} 迟到`
        description = `${staff?.name || '员工'} 在 ${punch.date} ${project?.name || '项目'} 上班打卡迟到，打卡时间: ${punch.checkInTime}`
      } else if (punch.status === 'early_leave') {
        alertType = 'missing_punch'
        severity = 'warning'
        title = `${staff?.name || '员工'} 早退`
        description = `${staff?.name || '员工'} 在 ${punch.date} ${project?.name || '项目'} 下班打卡早退，打卡时间: ${punch.checkOutTime}`
      }

      const alert: Alert = {
        id: `alert-${Date.now()}`,
        type: alertType,
        severity,
        status: 'open',
        title,
        description,
        relatedId: punch.id,
        relatedType: 'punch',
        projectId: punch.projectId,
        assigneeId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: null,
        resolutionNote: null,
        history: [{
          status: 'open',
          note: '系统自动生成预警',
          operatorId: 'system',
          timestamp: new Date().toISOString()
        }]
      }

      this.alerts.push(alert)
    },

    async supplementPunch(punchId: string, operatorId: string, checkInTime?: string, checkOutTime?: string, note?: string) {
      const punch = this.punchRecords.find(p => p.id === punchId)
      if (!punch) {
        throw new Error('打卡记录不存在')
      }

      const updates: Partial<PunchRecord> = {}
      if (checkInTime) updates.checkInTime = checkInTime
      if (checkOutTime) updates.checkOutTime = checkOutTime
      if (note) updates.note = note

      const schedule = this.schedules.find(s => s.id === punch.scheduleId)
      if (schedule) {
        let newStatus: PunchRecord['status'] = 'normal'
        const scheduledStart = schedule.startTime
        const scheduledEnd = schedule.endTime

        if (checkInTime && this.timeToMinutes(checkInTime) > this.timeToMinutes(scheduledStart)) {
          newStatus = 'late'
        }
        if (checkOutTime && this.timeToMinutes(checkOutTime) < this.timeToMinutes(scheduledEnd)) {
          newStatus = checkInTime && this.timeToMinutes(checkInTime) > this.timeToMinutes(scheduledStart) ? 'late' : 'early_leave'
        }

        updates.status = newStatus
      }

      Object.assign(punch, updates)

      const relatedAlert = this.alerts.find(a => 
        a.relatedId === punchId && a.relatedType === 'punch' && a.status !== 'resolved'
      )
      if (relatedAlert) {
        relatedAlert.status = 'in_progress'
        relatedAlert.updatedAt = new Date().toISOString()
        relatedAlert.history.push({
          status: 'in_progress',
          note: `人工补卡: ${note || '已处理'}`,
          operatorId,
          timestamp: new Date().toISOString()
        })
      }

      return punch
    }
  }
})
