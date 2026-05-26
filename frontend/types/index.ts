export type ID = string

export type CoachStatus = 'active' | 'leave' | 'off'
export type CourseStatus = 'scheduled' | 'completed' | 'cancelled' | 'leave' | 'rescheduled'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type LeaveType = 'annual' | 'sick' | 'personal' | 'other'
export type InspectionStatus =
  | 'pending'
  | 'recorded'
  | 'abnormal'
  | 'rectifying'
  | 'recheck_pending'
  | 'recheck_passed'
  | 'closed'
export type RecheckStatus = 'pending' | 'passed' | 'failed'

export interface Coach {
  id: ID
  name: string
  title: string
  status: CoachStatus
  phone?: string
}

export interface Member {
  id: ID
  name: string
  phone?: string
  balance: number
  total_sessions: number
  used_sessions: number
}

export interface StoredValueRecord {
  id: ID
  member_id: ID
  amount: number
  type: 'recharge' | 'consume' | 'refund'
  note?: string
  created_at: string
}

export interface Course {
  id: ID
  title: string
  coach_id: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  enrolled: number
  status: CourseStatus
  note?: string
  consume_record_id?: string
  consumed_member_id?: string
}

export interface LeaveRequest {
  id: ID
  coach_id: string
  type: LeaveType
  start_date: string
  end_date: string
  reason: string
  substitute_coach_id?: string
  status: LeaveStatus
  reviewer?: string
  review_note?: string
  reviewed_at?: string
  created_at: string
}

export type WaterItemKey =
  | 'pH'
  | '余氯'
  | '浊度'
  | '水温'
  | '尿素'
  | '大肠菌群'

export interface WaterReading {
  item: WaterItemKey
  value: number
  unit: string
  normal_range: string
  is_abnormal: boolean
}

export interface WaterInspection {
  id: ID
  pool_name: string
  inspector: string
  inspected_at: string
  readings: WaterReading[]
  photo_urls: string[]
  status: InspectionStatus
  remark?: string
  rectification_id?: string
}

export interface Rectification {
  id: ID
  inspection_id: string
  owner: string
  issue_summary: string
  measures: string[]
  due_date?: string
  status: 'rectifying' | 'recheck_pending' | 'closed'
  created_at: string
}

export interface Recheck {
  id: ID
  rectification_id: string
  rechecker: string
  rechecked_at?: string
  readings: WaterReading[]
  photo_urls: string[]
  status: RecheckStatus
  conclusion?: string
}

export interface Complaint {
  id: ID
  member_id?: string
  title: string
  content: string
  status: 'open' | 'processing' | 'closed'
  handler?: string
  created_at: string
}

export interface DashboardStats {
  pending_leaves: number
  rejected_leaves: number
  recheck_pending: number
  abnormal_inspections: number
  today_courses: number
  open_complaints: number
  pending_rectifications: number
}

export interface ActivityItem {
  id: ID
  kind: 'leave' | 'inspection' | 'rectification' | 'recheck' | 'complaint' | 'course'
  title: string
  status: string
  time: string
}

export interface DashboardResponse {
  stats: DashboardStats
  activities: ActivityItem[]
}
