export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmpty(value: string | null | undefined): boolean {
  return !value || String(value).trim() === ''
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(String(value).trim())
}

export interface FieldError {
  error: boolean
  messages: string[]
}

export function requiredField(
  value: string | null | undefined,
  triggered: boolean,
  message = 'Обязательное поле'
): FieldError {
  const hasError = triggered && isEmpty(value)
  return {
    error: hasError,
    messages: hasError ? [message] : []
  }
}

export function emailField(
  value: string | null | undefined,
  triggered: boolean,
  requiredMessage = 'Введите email',
  invalidMessage = 'Неверный формат email'
): FieldError {
  if (!triggered) return { error: false, messages: [] }
  if (isEmpty(value)) return { error: true, messages: [requiredMessage] }
  if (!isValidEmail(value!)) return { error: true, messages: [invalidMessage] }
  return { error: false, messages: [] }
}
