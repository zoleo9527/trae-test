export enum ProjectStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PREPARING = 'preparing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectPhase {
  PRE_CONSTRUCTION = 'pre_construction',
  CONSTRUCTION = 'construction',
  EXHIBITION = 'exhibition',
  TEARDOWN = 'teardown',
}

export const ProjectStatusTransitions: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.DRAFT]: [ProjectStatus.SCHEDULED, ProjectStatus.CANCELLED],
  [ProjectStatus.SCHEDULED]: [ProjectStatus.PREPARING, ProjectStatus.CANCELLED],
  [ProjectStatus.PREPARING]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  [ProjectStatus.IN_PROGRESS]: [ProjectStatus.COMPLETED],
  [ProjectStatus.COMPLETED]: [],
  [ProjectStatus.CANCELLED]: [],
};
