import Vue from 'vue'

export const snackbarBus = new Vue()

export interface SnackbarOptions {
  text: string
  color?: 'success' | 'error' | 'info' | 'warning'
  timeout?: number
}

export function showSnackbar(options: SnackbarOptions | string): void {
  const opts: SnackbarOptions = typeof options === 'string' 
    ? { text: options, color: 'success' } 
    : options
  snackbarBus.$emit('show', opts)
}
