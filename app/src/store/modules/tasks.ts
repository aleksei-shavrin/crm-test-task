import type { Module } from 'vuex'
import type { Task } from '@/shared/api/types'
import type { TaskPayload, PaginationParams, TaskFilters } from '@/shared/api/tasks'
import { fetchTasks, createTask, updateTask, deleteTask, fetchRandomTaskPayload } from '@/shared/api/tasks'

interface TasksState {
  items: Task[]
  total: number
  page: number
  limit: number
  loading: boolean
  filters: TaskFilters
}

const tasks: Module<TasksState, unknown> = {
  namespaced: true,
  state: () => ({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    loading: false,
    filters: {}
  }),
  getters: {
    allTasks: (state) => state.items,
    totalTasks: (state) => state.total,
    isLoading: (state) => state.loading,
    tasksByStatus: (state) => (status: string) => state.items.filter((t) => t.status === status),
    currentFilters: (state) => state.filters
  },
  mutations: {
    SET_TASKS(state, { items, total, page, limit }: { items: Task[]; total: number; page: number; limit: number }) {
      state.items = items
      state.total = total
      state.page = page
      state.limit = limit
    },
    SET_LOADING(state, loading: boolean) {
      state.loading = loading
    },
    SET_FILTERS(state, filters: TaskFilters) {
      state.filters = filters
    },
    ADD_TASK(state, task: Task) {
      state.items.unshift(task)
      state.total += 1
    },
    UPDATE_TASK(state, task: Task) {
      const idx = state.items.findIndex((t) => t.id === task.id)
      if (idx !== -1) state.items.splice(idx, 1, task)
    },
    REMOVE_TASK(state, id: string) {
      state.items = state.items.filter((t) => t.id !== id)
      state.total -= 1
    }
  },
  actions: {
    async fetch({ commit, state }, pagination?: PaginationParams) {
      commit('SET_LOADING', true)
      try {
        const result = await fetchTasks(pagination, state.filters)
        commit('SET_TASKS', result)
        return result
      } finally {
        commit('SET_LOADING', false)
      }
    },
    setFilters({ commit }, filters: TaskFilters) {
      commit('SET_FILTERS', filters)
    },
    async create({ commit }, payload: TaskPayload) {
      const task = await createTask(payload)
      commit('ADD_TASK', task)
      return task
    },
    async update({ commit }, { id, payload }: { id: string; payload: TaskPayload }) {
      const task = await updateTask(id, payload)
      commit('UPDATE_TASK', task)
      return task
    },
    async delete({ commit }, id: string) {
      await deleteTask(id)
      commit('REMOVE_TASK', id)
    },
    async fetchRandomPayload() {
      return fetchRandomTaskPayload()
    }
  }
}

export default tasks
