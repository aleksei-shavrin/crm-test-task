import type { Module } from 'vuex'
import type { UserResponse, LoginPayload, RegisterPayload, UpdateMePayload } from '@/shared/api/auth'
import { login as apiLogin, register as apiRegister, fetchMe, updateMe, logout as apiLogout } from '@/shared/api/auth'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

interface AuthState {
  user: UserResponse | null
  token: string | null
  loading: boolean
}

function loadUserFromStorage(): UserResponse | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserResponse
  } catch {
    return null
  }
}

const auth: Module<AuthState, unknown> = {
  namespaced: true,
  state: () => ({
    user: loadUserFromStorage(),
    token: localStorage.getItem(AUTH_TOKEN_KEY),
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    currentUser: (state) => state.user
  },
  mutations: {
    SET_USER(state, user: UserResponse | null) {
      state.user = user
      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_USER_KEY)
      }
    },
    SET_TOKEN(state, token: string | null) {
      state.token = token
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      }
    },
    SET_LOADING(state, loading: boolean) {
      state.loading = loading
    }
  },
  actions: {
    async login({ commit }, payload: LoginPayload) {
      commit('SET_LOADING', true)
      try {
        const { user, token } = await apiLogin(payload)
        commit('SET_TOKEN', token)
        commit('SET_USER', user)
        return user
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async register({ commit }, payload: RegisterPayload) {
      commit('SET_LOADING', true)
      try {
        const user = await apiRegister(payload)
        return user
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchMe({ commit }) {
      commit('SET_LOADING', true)
      try {
        const user = await fetchMe()
        commit('SET_USER', user)
        return user
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async updateMe({ commit }, payload: UpdateMePayload) {
      const user = await updateMe(payload)
      commit('SET_USER', user)
      return user
    },
    async logout({ commit }) {
      try {
        await apiLogout()
      } catch {
        // ignore
      }
      commit('SET_TOKEN', null)
      commit('SET_USER', null)
    }
  }
}

export default auth
