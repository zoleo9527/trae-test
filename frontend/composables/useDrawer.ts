import { defineStore } from 'pinia'

interface DrawerState {
  open: boolean
  title: string
  kind:
    | 'leave-review'
    | 'leave-create'
    | 'rectification'
    | 'recheck'
    | 'inspection'
    | null
  payload: Record<string, unknown>
}

export const useDrawerStore = defineStore('drawer', {
  state: (): DrawerState => ({
    open: false,
    title: '',
    kind: null,
    payload: {},
  }),
  actions: {
    openDrawer(
      kind: DrawerState['kind'],
      title: string,
      payload: Record<string, unknown> = {},
    ) {
      this.kind = kind
      this.title = title
      this.payload = payload
      this.open = true
    },
    closeDrawer() {
      this.open = false
      this.kind = null
      this.title = ''
      this.payload = {}
    },
  },
})
