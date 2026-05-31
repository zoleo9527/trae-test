import { d as defineStore } from "../server.mjs";
import { m as mockUsers } from "./data-CvF3Pjf4.js";
const useAuthStore = defineStore("auth", {
  state: () => ({
    currentUser: mockUsers[0],
    availableRoles: ["project_manager", "scheduling_specialist", "quality_inspector"]
  }),
  getters: {
    currentRole: (state) => state.currentUser?.role || "project_manager",
    isProjectManager: (state) => state.currentUser?.role === "project_manager",
    isSchedulingSpecialist: (state) => state.currentUser?.role === "scheduling_specialist",
    isQualityInspector: (state) => state.currentUser?.role === "quality_inspector",
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
export {
  useAuthStore as u
};
//# sourceMappingURL=auth-BO_zE_6L.js.map
