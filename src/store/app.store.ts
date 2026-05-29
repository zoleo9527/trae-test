import { create } from 'zustand';
import type { User, UserRole, TodoItem } from '@/types';
import { getPendingCount as getAppealPendingCount } from '@/services/appeal.service';
import { getPendingCount as getSubsidyPendingCount } from '@/services/subsidy.service';
import { getPendingCount as getAssessmentPendingCount } from '@/services/assessment.service';
import { getPendingCount as getTrainingPendingCount } from '@/services/training.service';

interface AppState {
  currentUser: User | null;
  userRole: UserRole | null;
  isLoggedIn: boolean;
  todos: TodoItem[];
  pendingCounts: {
    appeals: number;
    subsidies: number;
    assessments: number;
    trainings: number;
  };
  login: (role: UserRole) => void;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  refreshPendingCounts: () => void;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt'>) => void;
  removeTodo: (id: string) => void;
}

const users: Record<UserRole, User> = {
  manager: {
    id: 'user-manager',
    name: '刘涛',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liutao',
  },
  dispatcher: {
    id: 'user-dispatcher',
    name: '陈刚',
    role: 'dispatcher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenggang',
    zone: '朝阳区',
  },
  customer_service: {
    id: 'user-cs',
    name: '周婷',
    role: 'customer_service',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouting',
  },
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  userRole: null,
  isLoggedIn: false,
  todos: [],
  pendingCounts: {
    appeals: 0,
    subsidies: 0,
    assessments: 0,
    trainings: 0,
  },

  login: (role: UserRole) => {
    const user = users[role];
    set({
      currentUser: user,
      userRole: role,
      isLoggedIn: true,
    });
    get().refreshPendingCounts();
  },

  logout: () => {
    set({
      currentUser: null,
      userRole: null,
      isLoggedIn: false,
      todos: [],
    });
  },

  setUserRole: (role: UserRole) => {
    const user = users[role];
    set({
      currentUser: user,
      userRole: role,
    });
    get().refreshPendingCounts();
  },

  refreshPendingCounts: () => {
    set({
      pendingCounts: {
        appeals: getAppealPendingCount(),
        subsidies: getSubsidyPendingCount(),
        assessments: getAssessmentPendingCount(),
        trainings: getTrainingPendingCount(),
      },
    });
  },

  addTodo: (todo) => {
    const newTodo: TodoItem = {
      ...todo,
      id: `todo-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      todos: [...state.todos, newTodo],
    }));
  },

  removeTodo: (id) => {
    set(state => ({
      todos: state.todos.filter(t => t.id !== id),
    }));
  },
}));

export function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    manager: '运营经理',
    dispatcher: '调度专员',
    customer_service: '客服专员',
  };
  return names[role] || role;
}

export function hasPermission(requiredRoles: UserRole[]): boolean {
  const { userRole } = useAppStore.getState();
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}
