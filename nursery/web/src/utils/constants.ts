import {
    DiseaseSeverity,
    DiseaseStatus,
    InspectionStatus,
    NegotiationStatus,
    UserRole,
} from '@/types';

export const roleOptions = [
  { label: '基地负责人', value: UserRole.BASE_MANAGER, color: '#409EFF' },
  { label: '养护员', value: UserRole.INSPECTOR, color: '#67C23A' },
  { label: '销售跟单', value: UserRole.SALES, color: '#E6A23C' },
];

export const inspectionStatusOptions = [
  { label: '待处理', value: InspectionStatus.PENDING, color: '#E6A23C', type: 'warning' },
  { label: '已完成', value: InspectionStatus.COMPLETED, color: '#67C23A', type: 'success' },
];

export const diseaseSeverityOptions = [
  { label: '轻度', value: DiseaseSeverity.MINOR, color: '#67C23A', type: 'success' },
  { label: '中度', value: DiseaseSeverity.MODERATE, color: '#E6A23C', type: 'warning' },
  { label: '重度', value: DiseaseSeverity.MAJOR, color: '#F56C6C', type: 'danger' },
];

export const diseaseStatusOptions = [
  { label: '已上报', value: DiseaseStatus.REPORTED, color: '#909399', type: 'info' },
  { label: '已确认', value: DiseaseStatus.CONFIRMED, color: '#409EFF', type: 'primary' },
  { label: '处理中', value: DiseaseStatus.TREATING, color: '#E6A23C', type: 'warning' },
  { label: '已解决', value: DiseaseStatus.RESOLVED, color: '#67C23A', type: 'success' },
];

export const negotiationStatusOptions = [
  { label: '待处理', value: NegotiationStatus.PENDING, color: '#909399', type: 'info' },
  { label: '协商中', value: NegotiationStatus.IN_PROGRESS, color: '#E6A23C', type: 'warning' },
  { label: '已确认', value: NegotiationStatus.CONFIRMED, color: '#67C23A', type: 'success' },
  { label: '已关闭', value: NegotiationStatus.CLOSED, color: '#C0C4CC', type: 'info' },
];

export const getLabel = (options: { label: string; value: string }[], value: string): string => {
  return options.find(o => o.value === value)?.label || value;
};

export const getColor = (options: { color: string; value: string }[], value: string): string => {
  return options.find(o => o.value === value)?.color || '#909399';
};

export const getType = (options: { type?: string; value: string }[], value: string): string => {
  return options.find(o => o.value === value)?.type || 'info';
};
