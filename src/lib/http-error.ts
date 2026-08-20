import { isAxiosError } from 'axios'

/** Mensagem genérica da API (`{ success: false, message }`) num erro do axios. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return error.response.data.message
  }

  return fallback
}
