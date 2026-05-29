import { create } from 'zustand';
import type { ProcessStep, ProcessState, Order, Appeal, Subsidy, Assessment, Training, ResponsibleParty, TimelineEvent, Rider, UserRole } from '@/types';
import { determineResponsibility } from '@/utils/responsibility';

interface LoadOrderDataParams {
  order: Order;
  appeals: Appeal[];
  subsidies: Subsidy[];
  assessments: Assessment[];
  trainings: Training[];
  timeline: TimelineEvent[];
  rider?: Rider;
}

const STEP_ORDER: ProcessStep[] = ['review', 'appeal', 'subsidy', 'assessment', 'training', 'complete'];

const ALLOWED_STEPS_BY_ROLE: Record<UserRole, ProcessStep[]> = {
  manager: ['review', 'appeal', 'subsidy', 'assessment', 'training', 'complete'],
  dispatcher: ['review', 'appeal', 'subsidy', 'assessment', 'training', 'complete'],
  customer_service: ['review', 'appeal', 'complete'],
};

interface ProcessStoreState {
  processState: ProcessState | null;
  order: Order | null;
  appeals: Appeal[];
  subsidies: Subsidy[];
  assessments: Assessment[];
  trainings: Training[];
  timeline: TimelineEvent[];
  rider: Rider | undefined;
  selectedResponsibility: ResponsibleParty | null;
  isLoading: boolean;
  error: string | null;
  userRole: UserRole | null;
  allowedSteps: ProcessStep[];

  loadOrderData: (data: LoadOrderDataParams, userRole: UserRole) => void;
  clearProcessState: () => void;
  setCurrentStep: (step: ProcessStep) => void;
  setAppealDecision: (appeal: Appeal) => void;
  setSubsidyDecision: (subsidy: Subsidy) => void;
  setAssessmentDecision: (assessment: Assessment) => void;
  setSelectedResponsibility: (party: ResponsibleParty) => void;
  markStepComplete: (step: ProcessStep) => void;
  goToNextStep: () => void;
  resetProcess: () => void;
  setUserRole: (role: UserRole) => void;
}

function getFilteredCompletedSteps(
  rawCompleted: ProcessStep[],
  allowedSteps: ProcessStep[]
): ProcessStep[] {
  return rawCompleted.filter(step => allowedSteps.includes(step));
}

function getInitialCurrentStep(
  filteredCompleted: ProcessStep[],
  allowedSteps: ProcessStep[]
): ProcessStep {
  for (const step of allowedSteps) {
    if (!filteredCompleted.includes(step) && step !== 'complete') {
      return step;
    }
  }
  return 'complete';
}

function getNextStep(
  currentStep: ProcessStep,
  allowedSteps: ProcessStep[]
): ProcessStep {
  const currentIndex = allowedSteps.indexOf(currentStep);
  if (currentIndex < 0) return allowedSteps[0];
  if (currentIndex >= allowedSteps.length - 1) return 'complete';
  return allowedSteps[currentIndex + 1];
}

export const useProcessStore = create<ProcessStoreState>((set, get) => ({
  processState: null,
  order: null,
  appeals: [],
  subsidies: [],
  assessments: [],
  trainings: [],
  timeline: [],
  rider: undefined,
  selectedResponsibility: null,
  isLoading: false,
  error: null,
  userRole: null,
  allowedSteps: STEP_ORDER,

  loadOrderData: (data: LoadOrderDataParams, userRole: UserRole) => {
    const { order, appeals, subsidies, assessments, trainings, timeline, rider } = data;
    const allowedSteps = ALLOWED_STEPS_BY_ROLE[userRole] || STEP_ORDER;

    const responsibilityResult = determineResponsibility(order, appeals[0]);

    const rawCompletedSteps: ProcessStep[] = ['review'];
    if (appeals.some(a => a.status === 'resolved' || a.status === 'rejected')) {
      rawCompletedSteps.push('appeal');
    }
    if (subsidies.some(s => s.status === 'approved' || s.status === 'rejected')) {
      rawCompletedSteps.push('subsidy');
    }
    if (assessments.some(a => a.status === 'approved' || a.status === 'rejected')) {
      rawCompletedSteps.push('assessment');
    }
    if (trainings.some(t => t.status === 'completed')) {
      rawCompletedSteps.push('training');
    }

    const filteredCompletedSteps = getFilteredCompletedSteps(rawCompletedSteps, allowedSteps);
    const currentStep = getInitialCurrentStep(filteredCompletedSteps, allowedSteps);

    set({
      processState: {
        orderId: order.id,
        currentStep,
        completedSteps: filteredCompletedSteps,
        appealDecision: appeals.find(a => a.status === 'resolved' || a.status === 'rejected') || null,
        subsidyDecision: subsidies.find(s => s.status === 'approved' || s.status === 'rejected') || null,
        assessmentDecision: assessments.find(a => a.status === 'approved' || a.status === 'rejected') || null,
        autoTriggeredTraining: assessments.some(a => a.requiresTraining),
      },
      order,
      appeals,
      subsidies,
      assessments,
      trainings,
      timeline,
      rider,
      selectedResponsibility: responsibilityResult.party,
      isLoading: false,
      userRole,
      allowedSteps,
    });
  },

  clearProcessState: () => {
    set({
      processState: null,
      order: null,
      appeals: [],
      subsidies: [],
      assessments: [],
      trainings: [],
      timeline: [],
      rider: undefined,
      selectedResponsibility: null,
      isLoading: false,
      error: null,
      userRole: null,
      allowedSteps: STEP_ORDER,
    });
  },

  setCurrentStep: (step: ProcessStep) => {
    set(state => {
      if (!state.processState) return {};
      if (!state.allowedSteps.includes(step)) return {};
      return {
        processState: { ...state.processState, currentStep: step },
      };
    });
  },

  setAppealDecision: (appeal: Appeal) => {
    set(state => ({
      appeals: state.appeals.map(a => a.id === appeal.id ? appeal : a),
      processState: state.processState
        ? { ...state.processState, appealDecision: appeal }
        : null,
    }));
  },

  setSubsidyDecision: (subsidy: Subsidy) => {
    set(state => ({
      subsidies: state.subsidies.map(s => s.id === subsidy.id ? subsidy : s),
      processState: state.processState
        ? { ...state.processState, subsidyDecision: subsidy }
        : null,
    }));
  },

  setAssessmentDecision: (assessment: Assessment) => {
    set(state => ({
      assessments: state.assessments.map(a => a.id === assessment.id ? assessment : a),
      processState: state.processState
        ? { ...state.processState, assessmentDecision: assessment }
        : null,
    }));
  },

  setSelectedResponsibility: (party: ResponsibleParty) => {
    set({ selectedResponsibility: party });
  },

  markStepComplete: (step: ProcessStep) => {
    set(state => {
      if (!state.processState) return {};
      if (!state.allowedSteps.includes(step)) return {};
      const completedSteps = state.processState.completedSteps.includes(step)
        ? state.processState.completedSteps
        : [...state.processState.completedSteps, step];
      return {
        processState: {
          ...state.processState,
          completedSteps,
        },
      };
    });
  },

  goToNextStep: () => {
    set(state => {
      if (!state.processState) return {};
      const { processState, allowedSteps } = state;
      const nextStep = getNextStep(processState.currentStep, allowedSteps);
      const completedSteps = processState.completedSteps.includes(processState.currentStep)
        ? processState.completedSteps
        : [...processState.completedSteps, processState.currentStep];
      return {
        processState: {
          ...processState,
          currentStep: nextStep,
          completedSteps,
        },
      };
    });
  },

  resetProcess: () => {
    set({
      processState: null,
      order: null,
      appeals: [],
      subsidies: [],
      assessments: [],
      trainings: [],
      timeline: [],
      rider: undefined,
      selectedResponsibility: null,
      isLoading: false,
      error: null,
      userRole: null,
      allowedSteps: STEP_ORDER,
    });
  },

  setUserRole: (role: UserRole) => {
    const allowedSteps = ALLOWED_STEPS_BY_ROLE[role] || STEP_ORDER;
    set(state => {
      if (!state.processState) return { userRole: role, allowedSteps };
      const filteredCompletedSteps = getFilteredCompletedSteps(state.processState.completedSteps, allowedSteps);
      const currentStep = getInitialCurrentStep(filteredCompletedSteps, allowedSteps);
      return {
        userRole: role,
        allowedSteps,
        processState: {
          ...state.processState,
          currentStep,
          completedSteps: filteredCompletedSteps,
        },
      };
    });
  },
}));
