import type { Module } from 'vuex'
import type { Client } from '@/shared/api/types'
import type { ClientPayload, PaginationParams, ClientFilters } from '@/shared/api/clients'
import { fetchClients, createClient, updateClient, deleteClient, fetchRandomClientPayload } from '@/shared/api/clients'

interface ClientsState {
  items: Client[]
  total: number
  page: number
  limit: number
  loading: boolean
  filters: ClientFilters
}

const clients: Module<ClientsState, unknown> = {
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
    allClients: (state) => state.items,
    totalClients: (state) => state.total,
    isLoading: (state) => state.loading,
    currentFilters: (state) => state.filters
  },
  mutations: {
    SET_CLIENTS(state, { items, total, page, limit }: { items: Client[]; total: number; page: number; limit: number }) {
      state.items = items
      state.total = total
      state.page = page
      state.limit = limit
    },
    SET_LOADING(state, loading: boolean) {
      state.loading = loading
    },
    SET_FILTERS(state, filters: ClientFilters) {
      state.filters = filters
    },
    ADD_CLIENT(state, client: Client) {
      state.items.unshift(client)
      state.total += 1
    },
    UPDATE_CLIENT(state, client: Client) {
      const idx = state.items.findIndex((c) => c.id === client.id)
      if (idx !== -1) state.items.splice(idx, 1, client)
    },
    REMOVE_CLIENT(state, id: string) {
      state.items = state.items.filter((c) => c.id !== id)
      state.total -= 1
    }
  },
  actions: {
    async fetch({ commit, state }, pagination?: PaginationParams) {
      commit('SET_LOADING', true)
      try {
        const result = await fetchClients(pagination, state.filters)
        commit('SET_CLIENTS', result)
        return result
      } finally {
        commit('SET_LOADING', false)
      }
    },
    setFilters({ commit }, filters: ClientFilters) {
      commit('SET_FILTERS', filters)
    },
    async create({ commit }, payload: ClientPayload) {
      const client = await createClient(payload)
      commit('ADD_CLIENT', client)
      return client
    },
    async update({ commit }, { id, payload }: { id: string; payload: ClientPayload }) {
      const client = await updateClient(id, payload)
      commit('UPDATE_CLIENT', client)
      return client
    },
    async delete({ commit }, id: string) {
      await deleteClient(id)
      commit('REMOVE_CLIENT', id)
    },
    async fetchRandomPayload() {
      return fetchRandomClientPayload()
    }
  }
}

export default clients
