import type { Module } from 'vuex'
import type { Client, Task, TaskStatusCount } from '@/shared/api/types'
import { fetchStats, fetchRecentActivities } from '@/shared/api/dashboard'

interface DashboardState {
  clientsCount: number
  tasksCount: number
  taskStatuses: TaskStatusCount[]
  recentClients: Client[]
  recentTasks: Task[]
  loading: boolean
}

const dashboard: Module<DashboardState, unknown> = {
  namespaced: true,
  state: () => ({
    clientsCount: 0,
    tasksCount: 0,
    taskStatuses: [],
    recentClients: [],
    recentTasks: [],
    loading: false
  }),
  getters: {
    stats: (state) => ({
      clients: state.clientsCount,
      tasks: state.tasksCount,
      taskStatuses: state.taskStatuses
    }),
    recentClients: (state) => state.recentClients,
    recentTasks: (state) => state.recentTasks,
    isLoading: (state) => state.loading
  },
  mutations: {
    SET_STATS(state, { clients, tasks, taskStatuses }: { clients: number; tasks: number; taskStatuses: TaskStatusCount[] }) {
      state.clientsCount = clients
      state.tasksCount = tasks
      state.taskStatuses = taskStatuses
    },
    SET_RECENT(state, { clients, tasks }: { clients: Client[]; tasks: Task[] }) {
      state.recentClients = clients
      state.recentTasks = tasks
    },
    SET_LOADING(state, loading: boolean) {
      state.loading = loading
    }
  },
  actions: {
    async fetchAll({ commit }) {
      commit('SET_LOADING', true)
      try {
        const [stats, recent] = await Promise.all([
          fetchStats(),
          fetchRecentActivities().catch(() => ({ clients: [], tasks: [] }))
        ])
        commit('SET_STATS', {
          clients: stats.clients,
          tasks: stats.tasks,
          taskStatuses: stats.taskStatuses || []
        })
        commit('SET_RECENT', recent)
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}

export default dashboard
