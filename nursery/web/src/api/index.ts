import type {
    CreateDiseaseDto,
    CreateInspectionDto,
    CreateNegotiationDto,
    CreatePlotDto,
    CreateUserDto,
    DashboardStats,
    Disease,
    Inspection,
    Negotiation,
    Plot,
    QueryDiseaseDto,
    QueryInspectionDto,
    QueryNegotiationDto,
    QueryPlotDto,
    QueryUserDto,
    UpdateDiseaseStatusDto,
    UpdateNegotiationStatusDto,
    User,
} from '@/types';
import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const api = {
  dashboard: {
    getStats: (): Promise<DashboardStats> => request.get('/dashboard/stats').then(r => r.data),
  },
  users: {
    list: (params?: QueryUserDto): Promise<User[]> => request.get('/users', { params }).then(r => r.data),
    get: (id: number): Promise<User> => request.get(`/users/${id}`).then(r => r.data),
    create: (data: CreateUserDto): Promise<User> => request.post('/users', data).then(r => r.data),
  },
  plots: {
    list: (params?: QueryPlotDto): Promise<Plot[]> => request.get('/plots', { params }).then(r => r.data),
    get: (id: number): Promise<Plot> => request.get(`/plots/${id}`).then(r => r.data),
    create: (data: CreatePlotDto): Promise<Plot> => request.post('/plots', data).then(r => r.data),
    update: (id: number, data: Partial<CreatePlotDto>): Promise<Plot> => request.put(`/plots/${id}`, data).then(r => r.data),
  },
  inspections: {
    list: (params?: QueryInspectionDto): Promise<Inspection[]> => request.get('/inspections', { params }).then(r => r.data),
    get: (id: number): Promise<Inspection> => request.get(`/inspections/${id}`).then(r => r.data),
    create: (data: CreateInspectionDto): Promise<Inspection> => request.post('/inspections', data).then(r => r.data),
    complete: (id: number, data: Partial<CreateInspectionDto>): Promise<Inspection> => request.put(`/inspections/${id}/complete`, data).then(r => r.data),
  },
  diseases: {
    list: (params?: QueryDiseaseDto): Promise<Disease[]> => request.get('/diseases', { params }).then(r => r.data),
    get: (id: number): Promise<Disease> => request.get(`/diseases/${id}`).then(r => r.data),
    create: (data: CreateDiseaseDto): Promise<Disease> => request.post('/diseases', data).then(r => r.data),
    updateStatus: (id: number, data: UpdateDiseaseStatusDto): Promise<Disease> => request.put(`/diseases/${id}/status`, data).then(r => r.data),
  },
  negotiations: {
    list: (params?: QueryNegotiationDto): Promise<Negotiation[]> => request.get('/negotiations', { params }).then(r => r.data),
    get: (id: number): Promise<Negotiation> => request.get(`/negotiations/${id}`).then(r => r.data),
    create: (data: CreateNegotiationDto): Promise<Negotiation> => request.post('/negotiations', data).then(r => r.data),
    updateStatus: (id: number, data: UpdateNegotiationStatusDto): Promise<Negotiation> => request.put(`/negotiations/${id}/status`, data).then(r => r.data),
  },
};


