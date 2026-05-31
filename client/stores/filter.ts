import { defineStore } from 'pinia'
import type { FilterOptions } from '~/types'

interface FilterState {
  global: FilterOptions
  calendar: {
    currentDate: string
    viewMode: 'month' | 'week' | 'day'
    selectedDate: string | null
  }
}

export const useFilterStore = defineStore('filter', {
  state: (): FilterState => ({
    global: {
      dateRange: null,
      projectIds: [],
      statuses: [],
      types: [],
      searchText: ''
    },
    calendar: {
      currentDate: new Date().toISOString().split('T')[0],
      viewMode: 'month',
      selectedDate: null
    }
  }),

  getters: {
    hasActiveFilters: (state): boolean => {
      return state.global.dateRange !== null ||
             state.global.projectIds.length > 0 ||
             state.global.statuses.length > 0 ||
             state.global.types.length > 0 ||
             state.global.searchText !== ''
    }
  },

  actions: {
    setDateRange(range: [string, string] | null) {
      this.global.dateRange = range
    },

    toggleProjectId(projectId: string) {
      const index = this.global.projectIds.indexOf(projectId)
      if (index > -1) {
        this.global.projectIds.splice(index, 1)
      } else {
        this.global.projectIds.push(projectId)
      }
    },

    toggleStatus(status: string) {
      const index = this.global.statuses.indexOf(status)
      if (index > -1) {
        this.global.statuses.splice(index, 1)
      } else {
        this.global.statuses.push(status)
      }
    },

    toggleType(type: string) {
      const index = this.global.types.indexOf(type)
      if (index > -1) {
        this.global.types.splice(index, 1)
      } else {
        this.global.types.push(type)
      }
    },

    setSearchText(text: string) {
      this.global.searchText = text
    },

    clearAllFilters() {
      this.global = {
        dateRange: null,
        projectIds: [],
        statuses: [],
        types: [],
        searchText: ''
      }
    },

    setCalendarDate(date: string) {
      this.calendar.currentDate = date
    },

    setCalendarViewMode(mode: 'month' | 'week' | 'day') {
      this.calendar.viewMode = mode
    },

    setSelectedDate(date: string | null) {
      this.calendar.selectedDate = date
    },

    navigateCalendar(direction: 'prev' | 'next') {
      const current = new Date(this.calendar.currentDate)
      if (this.calendar.viewMode === 'month') {
        current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1))
      } else if (this.calendar.viewMode === 'week') {
        current.setDate(current.getDate() + (direction === 'next' ? 7 : -7))
      } else {
        current.setDate(current.getDate() + (direction === 'next' ? 1 : -1))
      }
      this.calendar.currentDate = current.toISOString().split('T')[0]
    },

    goToToday() {
      this.calendar.currentDate = new Date().toISOString().split('T')[0]
    }
  }
})
