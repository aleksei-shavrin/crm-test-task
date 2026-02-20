import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'
import clients from './modules/clients'
import tasks from './modules/tasks'
import dashboard from './modules/dashboard'
import type { UserResponse } from '@/shared/api/auth'
import type { Client, Task, TaskStatusCount } from '@/shared/api/types'

Vue.use(Vuex)

export interface AuthState {
  user: UserResponse | null
  token: string | null
  loading: boolean
}

export interface ClientsState {
  items: Client[]
  total: number
  page: number
  limit: number
  loading: boolean
}

export interface TasksState {
  items: Task[]
  total: number
  page: number
  limit: number
  loading: boolean
}

export interface DashboardState {
  clientsCount: number
  tasksCount: number
  taskStatuses: TaskStatusCount[]
  recentClients: Client[]
  recentTasks: Task[]
  loading: boolean
}

export interface RootState {
  auth: AuthState
  clients: ClientsState
  tasks: TasksState
  dashboard: DashboardState
}

const store = new Vuex.Store<RootState>({
  modules: {
    auth,
    clients,
    tasks,
    dashboard
  }
})

export default store
