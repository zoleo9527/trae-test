export type UserRole = 'director' | 'head_coach' | 'reception'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  created_at: number
}

export interface Locker {
  id: number
  locker_no: string
  zone: string
  status: 'available' | 'occupied' | 'maintenance' | 'damaged'
  note?: string
  created_at: number
}

export interface Member {
  id: number
  member_no: string
  name: string
  phone?: string
  balance: number
  status: 'active' | 'frozen' | 'expired'
  created_at: number
}

export interface Coach {
  id: number
  name: string
  phone?: string
  specialty?: string
  status: string
  created_at: number
}

export interface Course {
  id: number
  name: string
  coach_id?: number
  start_time: number
  end_time: number
  capacity: number
  enrolled: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  created_at: number
  coach_name?: string
}

export interface CourseEnrollment {
  id: number
  course_id: number
  member_id: number
  status: 'enrolled' | 'attended' | 'absent' | 'leave'
  checkin_time?: number
  created_at: number
  member_name?: string
  course_name?: string
}

export interface Transaction {
  id: number
  member_id: number
  type: 'recharge' | 'consume' | 'refund'
  amount: number
  balance_after: number
  related_id?: number
  operator_id?: number
  note?: string
  created_at: number
  member_name?: string
  operator_name?: string
}

export interface LockerAssignment {
  id: number
  locker_id: number
  member_id?: number
  guest_name?: string
  assign_type: 'member' | 'guest' | 'temporary'
  assigned_at: number
  expired_at?: number
  released_at?: number
  operator_id?: number
  status: 'active' | 'released' | 'overdue'
  created_at: number
  locker_no?: string
  member_name?: string
  operator_name?: string
}

export interface PatrolPhoto {
  id: number
  photo_path: string
  location: string
  issue_type?: string
  description?: string
  reporter_id?: number
  status: 'reported' | 'processing' | 'resolved' | 'ignored'
  created_at: number
  reporter_name?: string
}

export type AppealType = 'locker_issue' | 'course_leave' | 'billing_error' | 'water_quality' | 'other'
export type AppealStatus = 'pending' | 'investigating' | 'resolved' | 'rejected' | 'escalated'
export type AppealPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Appeal {
  id: number
  appeal_no: string
  type: AppealType
  title: string
  description: string
  related_locker_id?: number
  related_course_id?: number
  related_transaction_id?: number
  related_patrol_id?: number
  related_assignment_id?: number
  reporter_id?: number
  assignee_id?: number
  status: AppealStatus
  priority: AppealPriority
  created_at: number
  updated_at: number
  reporter_name?: string
  assignee_name?: string
  locker_no?: string
  locker_zone?: string
  course_name?: string
  transaction_id?: number
  transaction_amount?: number
  transaction_type?: string
  transaction_member_id?: number
  transaction_member_name?: string
  patrol_location?: string
  patrol_description?: string
  assignment_assigned_at?: number
  assignment_operator_id?: number
  assignment_operator_name?: string
  assignment_member_id?: number
  assignment_member_name?: string
  assignment_guest_name?: string
}

export interface AppealTimeline {
  id: number
  appeal_id: number
  actor_id?: number
  action: string
  note?: string
  created_at: number
  actor_name?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  director: '馆长',
  head_coach: '教练主管',
  reception: '前台客服'
}

export const APPEAL_TYPE_LABELS: Record<AppealType, string> = {
  locker_issue: '储物柜问题',
  course_leave: '请假消课',
  billing_error: '账单错误',
  water_quality: '水质问题',
  other: '其他投诉'
}

export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  pending: '待处理',
  investigating: '调查中',
  resolved: '已解决',
  rejected: '已驳回',
  escalated: '已升级'
}

export const APPEAL_PRIORITY_LABELS: Record<AppealPriority, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急'
}

export const LOCKER_STATUS_LABELS: Record<Locker['status'], string> = {
  available: '空闲',
  occupied: '使用中',
  maintenance: '维护中',
  damaged: '已损坏'
}

declare global {
  interface Window {
    db: {
      query: (sql: string, params?: any[]) => Promise<any[]>
      run: (sql: string, params?: any[]) => Promise<{ changes: number; lastInsertRowid: number }>
      transaction: (statements: { sql: string; params?: any[] }[]) => Promise<void>
    }
    app: {
      getAppDataPath: () => Promise<string>
      getCurrentUser: () => Promise<User | null>
      setCurrentUser: (user: User | null) => Promise<boolean>
      onMenuNewAppeal: (callback: () => void) => void
      removeMenuNewAppeal: (callback: () => void) => void
      onMenuAssignLocker: (callback: () => void) => void
      removeMenuAssignLocker: (callback: () => void) => void
      onMenuSwitchRole: (callback: () => void) => void
      removeMenuSwitchRole: (callback: () => void) => void
    }
  }
}
