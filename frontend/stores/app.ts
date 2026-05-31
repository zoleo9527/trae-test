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
    filterStatus: 'all' as string,
    loadError: null as string | null
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
      const api = useAPI()
      try {
        this.projects = await api.get('/projects') as any
        return this.projects
      } catch (e: any) {
        this.projects = []
        this.loadError = '加载项目数据失败'
        throw new Error(this.loadError + '：' + (e.message || '网络异常'))
      }
    },

    async loadTeams() {
      const api = useAPI()
      try {
        this.teams = await api.get('/teams') as any
        return this.teams
      } catch (e: any) {
        this.teams = []
        this.loadError = '加载班组数据失败'
        throw new Error(this.loadError + '：' + (e.message || '网络异常'))
      }
    },

    async loadUsers() {
      const api = useAPI()
      try {
        this.users = await api.get('/users') as any
        return this.users
      } catch (e: any) {
        this.users = []
        this.loadError = '加载用户数据失败'
        throw new Error(this.loadError + '：' + (e.message || '网络异常'))
      }
    },

    async loadAllBaseData() {
      this.loadError = null
      const errors: string[] = []
      try {
        await Promise.all([
          this.loadProjects().catch(e => { errors.push(e.message); throw e }),
          this.loadTeams().catch(e => { errors.push(e.message); throw e }),
          this.loadUsers().catch(e => { errors.push(e.message); throw e })
        ])
      } catch (e: any) {
        throw new Error(errors[0] || e.message || '基础数据加载失败')
      }
    },

    clearError() {
      this.loadError = null
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
