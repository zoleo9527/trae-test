import { create } from 'zustand';
import type { ProcessStep, ProcessState, Order, Appeal, Subsidy, Assessment, Training, ResponsibleParty, TimelineEvent, Rider } from '@/types';
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

  loadOrderData: (data: LoadOrderDataParams) => void;
  clearProcessState: () => void;
  setCurrentStep: (step: ProcessStep) => void;
  setAppealDecision: (appeal: Appeal) => void;
  setSubsidyDecision: (subsidy: Subsidy) => void;
  setAssessmentDecision: (assessment: Assessment) => void;
  setSelectedResponsibility: (party: ResponsibleParty) => void;
  markStepComplete: (step: ProcessStep) => void;
  goToNextStep: () => void;
  resetProcess: () => void;
}

const STEP_ORDER: ProcessStep[] = ['review', 'appeal', 'subsidy', 'assessment', 'training', 'complete'];

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

  loadOrderData: (data: LoadOrderDataParams) => {
    const { order, appeals, subsidies, assessments, trainings, timeline, rider } = data;

    const responsibilityResult = determineResponsibility(order, appeals[0]);

    const completedSteps: ProcessStep[] = ['review'];
    if (appeals.some(a => a.status === 'resolved' || a.status === 'rejected')) {
      completedSteps.push('appeal');
    }
    if (subsidies.some(s => s.status === 'approved' || s.status === 'rejected')) {
      completedSteps.push('subsidy');
    }
    if (assessments.some(a => a.status === 'approved' || a.status === 'rejected')) {
      completedSteps.push('assessment');
    }
    if (trainings.some(t => t.status === 'completed')) {
      completedSteps.push('training');
    }

    let currentStep: ProcessStep = 'review';
    for (const step of STEP_ORDER) {
      if (!completedSteps.includes(step)) {
        currentStep = step;
        break;
      }
    }
    if (completedSteps.length === STEP_ORDER.length - 1) {
      currentStep = 'complete';
    }

    set({
      processState: {
        orderId: order.id,
        currentStep,
        completedSteps,
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
    });
  },

  setCurrentStep: (step: ProcessStep) => {
    set(state => ({
      processState: state.processState
        ? { ...state.processState, currentStep: step }
        : null,
    }));
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
      const currentIndex = STEP_ORDER.indexOf(state.processState.currentStep);
      const nextStep = STEP_ORDER[currentIndex + 1] || 'complete';
      const completedSteps = state.processState.completedSteps.includes(state.processState.currentStep)
        ? state.processState.completedSteps
        : [...state.processState.completedSteps, state.processState.currentStep];
      return {
        processState: {
          ...state.processState,
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
    });
  },
}));
