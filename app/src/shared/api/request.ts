import Vue from 'vue'
import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { getToken, clearToken, clearUser } from '@/shared/auth'

export const apiState = Vue.observable({ pendingCount: 0 })

const api: AxiosInstance = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    apiState.pendingCount += 1
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    apiState.pendingCount -= 1
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    apiState.pendingCount -= 1
    return response
  },
  (error: AxiosError) => {
    apiState.pendingCount -= 1
    if (error.response?.status === 401) {
      clearToken()
      clearUser()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const isApiLoading = (): boolean => apiState.pendingCount > 0
