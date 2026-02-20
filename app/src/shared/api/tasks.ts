import type { Task, TaskPriority, TaskStatus } from './types'
import api from './request'

const API_BASE = '/api'

export interface TaskPayload {
  title: string
  description: string
  clientId: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface TaskFilters {
  status?: TaskStatus
  assigneeId?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function fetchTasks(pagination?: PaginationParams, filters?: TaskFilters): Promise<PaginatedResult<Task>> {
  const { data } = await api.get<PaginatedResult<Task>>(`${API_BASE}/tasks`, {
    params: { page: pagination?.page, limit: pagination?.limit, ...filters }
  })
  return data
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const { data } = await api.post<Task>(`${API_BASE}/tasks`, payload)
  return data
}

export async function updateTask(id: string, payload: TaskPayload): Promise<Task> {
  const { data } = await api.put<Task>(`${API_BASE}/tasks/${id}`, payload)
  return data
}

export async function fetchRandomTaskPayload(): Promise<TaskPayload> {
  const { data } = await api.get<TaskPayload>(`${API_BASE}/tasks/random-payload`)
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`${API_BASE}/tasks/${id}`)
}
