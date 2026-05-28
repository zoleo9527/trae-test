export type UserRole = 'director' | 'teacher' | 'logistics';

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  pendingCount: number;
  rejectedCount: number;
  reviewNeededCount: number;
  totalCampers: number;
  activeCampers: number;
  todayAttendanceRate: number;
}

export interface TodoItem {
  id: string;
  type: 'attendance' | 'medical' | 'supply' | 'feedback';
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export interface Camper {
  id: string;
  name: string;
  gender: string;
  age: number;
  group_name: string;
  emergency_contact: string;
  emergency_phone: string;
  health_notes: string;
  room_id: string | null;
  status: 'active' | 'inactive';
  room?: Room | null;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  campers?: Camper[];
}

export interface Attendance {
  id: string;
  camper_id: string;
  date: string;
  session: string;
  status: 'present' | 'absent' | 'late';
  remark: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  reviewed_by: string | null;
  rejection_reason?: string;
  camper?: Camper;
  submitter?: User;
  reviewer?: User;
}

export interface MedicalFollowUp {
  id: string;
  medical_id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: User;
}

export interface MedicalRecord {
  id: string;
  camper_id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  treatment: string;
  status: 'pending' | 'in_progress' | 'resolved';
  reported_by: string;
  resolved_by: string | null;
  camper?: Camper;
  reporter?: User;
  resolver?: User;
  follow_ups?: MedicalFollowUp[];
}

export interface Supply {
  id: string;
  camper_id: string;
  item_name: string;
  quantity: number;
  reason: string;
  status: 'pending' | 'fulfilled';
  requested_by: string;
  fulfilled_by: string | null;
  camper?: Camper;
  requester?: User;
  fulfiller?: User;
}

export interface Feedback {
  id: string;
  camper_id: string;
  type: string;
  content: string;
  parent_response: string;
  status: 'pending' | 'completed';
  assignee_id: string | null;
  camper?: Camper;
  assignee?: User;
}

export interface TimelineEvent {
  id: string;
  camper_id: string;
  event_type: string;
  event_title: string;
  event_description: string;
  operator_id: string;
  created_at: string;
  operator?: User;
}

interface ListResponse<T> {
  data: T[];
  total: number;
}

interface DataResponse<T> {
  data: T;
}

interface MessageResponse {
  message: string;
}

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    const response = await this.request<DataResponse<User>>('/auth/me');
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<DataResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  }

  async getTodoList(): Promise<TodoItem[]> {
    const response = await this.request<DataResponse<TodoItem[]>>('/dashboard/todo');
    return response.data;
  }

  async getCampers(): Promise<Camper[]> {
    const response = await this.request<ListResponse<Camper>>('/campers');
    return response.data;
  }

  async getCamper(id: string): Promise<Camper> {
    const response = await this.request<DataResponse<Camper>>(`/campers/${id}`);
    return response.data;
  }

  async createCamper(data: Partial<Camper>): Promise<Camper> {
    const response = await this.request<DataResponse<Camper>>('/campers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateCamper(id: string, data: Partial<Camper>): Promise<Camper> {
    const response = await this.request<DataResponse<Camper>>(`/campers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteCamper(id: string): Promise<string> {
    const response = await this.request<MessageResponse>(`/campers/${id}`, {
      method: 'DELETE',
    });
    return response.message;
  }

  async getCamperTimeline(camperId: string): Promise<TimelineEvent[]> {
    const response = await this.request<ListResponse<TimelineEvent>>(`/campers/${camperId}/timeline`);
    return response.data;
  }

  async getAttendance(): Promise<Attendance[]> {
    const response = await this.request<ListResponse<Attendance>>('/attendance');
    return response.data;
  }

  async createAttendance(data: Partial<Attendance>): Promise<Attendance> {
    const response = await this.request<DataResponse<Attendance>>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance> {
    const response = await this.request<DataResponse<Attendance>>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async approveAttendance(id: string): Promise<Attendance> {
    const response = await this.request<DataResponse<Attendance>>(`/attendance/${id}/approve`, {
      method: 'POST',
    });
    return response.data;
  }

  async rejectAttendance(id: string, reason: string): Promise<Attendance> {
    const response = await this.request<DataResponse<Attendance>>(`/attendance/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data;
  }

  async getMedicalRecords(): Promise<MedicalRecord[]> {
    const response = await this.request<ListResponse<MedicalRecord>>('/medical');
    return response.data;
  }

  async createMedicalRecord(data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const response = await this.request<DataResponse<MedicalRecord>>('/medical', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const response = await this.request<DataResponse<MedicalRecord>>(`/medical/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async resolveMedical(id: string): Promise<MedicalRecord> {
    const response = await this.request<DataResponse<MedicalRecord>>(`/medical/${id}/resolve`, {
      method: 'POST',
    });
    return response.data;
  }

  async addFollowup(id: string, content: string): Promise<MedicalRecord> {
    const response = await this.request<DataResponse<MedicalRecord>>(`/medical/${id}/followup`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.data;
  }

  async getRooms(): Promise<Room[]> {
    const response = await this.request<ListResponse<Room>>('/rooms');
    return response.data;
  }

  async createRoom(data: Partial<Room>): Promise<Room> {
    const response = await this.request<DataResponse<Room>>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    const response = await this.request<DataResponse<Room>>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async assignRoom(roomId: string, camperId: string): Promise<Room> {
    const response = await this.request<DataResponse<Room>>('/rooms/assign', {
      method: 'POST',
      body: JSON.stringify({ roomId, camperId }),
    });
    return response.data;
  }

  async unassignRoom(roomId: string, camperId: string): Promise<Room> {
    const response = await this.request<DataResponse<Room>>('/rooms/unassign', {
      method: 'POST',
      body: JSON.stringify({ roomId, camperId }),
    });
    return response.data;
  }

  async getSupplies(): Promise<Supply[]> {
    const response = await this.request<ListResponse<Supply>>('/supplies');
    return response.data;
  }

  async createSupply(data: Partial<Supply>): Promise<Supply> {
    const response = await this.request<DataResponse<Supply>>('/supplies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateSupply(id: string, data: Partial<Supply>): Promise<Supply> {
    const response = await this.request<DataResponse<Supply>>(`/supplies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async fulfillSupply(id: string): Promise<Supply> {
    const response = await this.request<DataResponse<Supply>>(`/supplies/${id}/fulfill`, {
      method: 'POST',
    });
    return response.data;
  }

  async getFeedback(): Promise<Feedback[]> {
    const response = await this.request<ListResponse<Feedback>>('/feedback');
    return response.data;
  }

  async createFeedback(data: Partial<Feedback>): Promise<Feedback> {
    const response = await this.request<DataResponse<Feedback>>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateFeedback(id: string, data: Partial<Feedback>): Promise<Feedback> {
    const response = await this.request<DataResponse<Feedback>>(`/feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async completeFeedback(id: string, parent_response: string): Promise<Feedback> {
    const response = await this.request<DataResponse<Feedback>>(`/feedback/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ parent_response }),
    });
    return response.data;
  }
}

export const api = new ApiClient();
