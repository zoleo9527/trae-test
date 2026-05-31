import { d as defineStore } from './server.mjs';
import { m as mockUsers } from './data-CvF3Pjf4.mjs';

const useAuthStore = defineStore("auth", {
  state: () => ({
    currentUser: mockUsers[0],
    availableRoles: ["project_manager", "scheduling_specialist", "quality_inspector"]
  }),
  getters: {
    currentRole: (state) => {
      var _a;
      return ((_a = state.currentUser) == null ? void 0 : _a.role) || "project_manager";
    },
    isProjectManager: (state) => {
      var _a;
      return ((_a = state.currentUser) == null ? void 0 : _a.role) === "project_manager";
    },
    isSchedulingSpecialist: (state) => {
      var _a;
      return ((_a = state.currentUser) == null ? void 0 : _a.role) === "scheduling_specialist";
    },
    isQualityInspector: (state) => {
      var _a;
      return ((_a = state.currentUser) == null ? void 0 : _a.role) === "quality_inspector";
    },
    hasPermission: (state) => (requiredRoles) => {
      if (!state.currentUser) return false;
      return requiredRoles.includes(state.currentUser.role);
    }
  },
  actions: {
    switchRole(role) {
      const user = mockUsers.find((u) => u.role === role);
      if (user) {
        this.currentUser = user;
      }
    },
    setUser(user) {
      this.currentUser = user;
    }
  }
});

export { useAuthStore as u };
//# sourceMappingURL=auth-BO_zE_6L.mjs.map
