import type { Client, ClientStatus } from './types'
import api from './request'

const API_BASE = '/api'

export interface ClientPayload {
  name: string
  email: string
  phone?: string
  company?: string
  status: ClientStatus
  managerId?: string
  notes?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface ClientFilters {
  status?: ClientStatus
  managerId?: string
  search?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function fetchClients(pagination?: PaginationParams, filters?: ClientFilters): Promise<PaginatedResult<Client>> {
  const { data } = await api.get<PaginatedResult<Client>>(`${API_BASE}/clients`, {
    params: { page: pagination?.page, limit: pagination?.limit, ...filters }
  })
  return data
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const { data } = await api.post<Client>(`${API_BASE}/clients`, payload)
  return data
}

export async function updateClient(id: string, payload: ClientPayload): Promise<Client> {
  const { data } = await api.put<Client>(`${API_BASE}/clients/${encodeURIComponent(id)}`, payload)
  return data
}

export async function fetchRandomClientPayload(): Promise<ClientPayload> {
  const { data } = await api.get<ClientPayload>(`${API_BASE}/clients/random-payload`)
  return data
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`${API_BASE}/clients/${encodeURIComponent(id)}`)
}
