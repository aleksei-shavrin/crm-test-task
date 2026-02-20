import store, { type RootState } from '@/store'
import type { UserResponse } from '@/shared/api/auth'

export function getToken(): string | null {
  return (store.state as RootState).auth.token
}

export function setToken(token: string): void {
  store.commit('auth/SET_TOKEN', token)
}

export function clearToken(): void {
  store.commit('auth/SET_TOKEN', null)
}

export function getUser(): UserResponse | null {
  return (store.state as RootState).auth.user
}

export function setUser(user: UserResponse): void {
  store.commit('auth/SET_USER', user)
}

export function clearUser(): void {
  store.commit('auth/SET_USER', null)
}

export function isAuthenticated(): boolean {
  return store.getters['auth/isAuthenticated']
}

export function isAdmin(): boolean {
  return store.getters['auth/isAdmin']
}
