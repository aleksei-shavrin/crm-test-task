import api from './request'
import type { AxiosError } from 'axios'

export type UserRole = 'admin' | 'manager'

export interface UserResponse {
  id: string
  email: string
  name: string
  role: UserRole
  avatar: string
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserResponse
  token: string
}

export interface RegisterPayload {
  email: string
  password: string
  name?: string
  role?: UserRole
  avatar?: string
}

const API_BASE = '/api'

function getErrorMessage(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ error?: string }>
  return err.response?.data?.error || fallback
}

export async function register(payload: RegisterPayload): Promise<UserResponse> {
  try {
    const { data } = await api.post<UserResponse>(`${API_BASE}/register`, payload)
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e, 'Registration failed'))
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>(`${API_BASE}/login`, payload)
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e, 'Login failed'))
  }
}

export async function fetchMe(): Promise<UserResponse> {
  try {
    const { data } = await api.get<UserResponse>(`${API_BASE}/me`)
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e, 'Failed to fetch user'))
  }
}

export interface UpdateMePayload {
  name?: string
  avatar?: string
}

export async function updateMe(payload: UpdateMePayload): Promise<UserResponse> {
  try {
    const { data } = await api.put<UserResponse>(`${API_BASE}/me`, payload)
    return data
  } catch (e) {
    throw new Error(getErrorMessage(e, 'Failed to update user'))
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post(`${API_BASE}/logout`)
  } catch {
    // ignore
  }
}

export async function fetchUsers(): Promise<UserResponse[]> {
  const { data } = await api.get<UserResponse[]>(`${API_BASE}/users`)
  return data
}
