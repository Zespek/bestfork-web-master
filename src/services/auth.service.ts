import { IAuthResponse } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export async function login(email: string, password: string): Promise<IAuthResponse> {
  const { data } = await api.post<ApiEnvelope<IAuthResponse>>('/api/v1/auth/login', {
    email,
    password,
  })

  return data.data
}

export async function me(): Promise<IAuthResponse['user']> {
  const { data } = await api.get<ApiEnvelope<IAuthResponse['user']>>('/api/v1/auth/me')

  return data.data
}

export interface ForgotPasswordResult {
  /** Só vem preenchido fora de produção — atalho pra testar sem inbox real. */
  devResetLink?: string
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const { data } = await api.post<ApiEnvelope<ForgotPasswordResult>>(
    '/api/v1/auth/forgot-password',
    { email },
  )

  return data.data
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/api/v1/auth/reset-password', { token, password })
}
