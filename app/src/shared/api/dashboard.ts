import type { Client, StatsResponse, Task } from './types'
import api from './request'

const API_BASE = '/api'

export async function fetchStats(): Promise<StatsResponse> {
  const { data } = await api.get<StatsResponse>(`${API_BASE}/stats`)
  return data
}

export interface RecentActivitiesResponse {
  clients: Client[]
  tasks: Task[]
}

export async function fetchRecentActivities(): Promise<RecentActivitiesResponse> {
  const { data } = await api.get<RecentActivitiesResponse>(`${API_BASE}/recent-activities`)
  return data
}
