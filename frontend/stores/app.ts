import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    projects: [],
    teams: [],
    users: [],
    user: null as any,
    selectedProjectId: null as number | null,
    selectedDiaryId: null as number | null,
    selectedInspectionId: null as number | null,
    selectedSettlementId: null as number | null,
    filterStatus: 'all' as string
  }),

  getters: {
    selectedProject: (state) => state.projects.find((p: any) => p.id === state.selectedProjectId),
    activeProjects: (state) => state.projects.filter((p: any) => p.status === 'in_progress')
  },

  actions: {
    initFromAuth() {
      const authStore = useAuthStore()
      this.user = authStore.user
    },

    async loadProjects() {
      try {
        const api = useAPI()
        this.projects = await api.get('/projects') as any
      } catch (e) {
        this.projects = []
      }
    },

    async loadTeams() {
      try {
        const api = useAPI()
        this.teams = await api.get('/teams') as any
      } catch (e) {
        this.teams = []
      }
    },

    async loadUsers() {
      try {
        const api = useAPI()
        this.users = await api.get('/users') as any
      } catch (e) {
        this.users = []
      }
    },

    selectProject(id: number) {
      this.selectedProjectId = id
      this.selectedDiaryId = null
      this.selectedInspectionId = null
    },

    selectDiary(id: number) {
      this.selectedDiaryId = id
      this.selectedInspectionId = null
    },

    selectInspection(id: number) {
      this.selectedInspectionId = id
    },

    selectSettlement(id: number) {
      this.selectedSettlementId = id
    },

    setFilterStatus(status: string) {
      this.filterStatus = status
    }
  }
})
