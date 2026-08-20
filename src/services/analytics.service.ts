import { IAnalyticsSummary } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export async function getAnalyticsSummary(): Promise<IAnalyticsSummary> {
  const { data } = await api.get<ApiEnvelope<IAnalyticsSummary>>('/api/v1/analytics/summary')

  return data.data
}

/** Baixa o CSV real do relatório e dispara o download no navegador. */
export async function exportAnalyticsReport(): Promise<void> {
  const response = await api.get('/api/v1/analytics/export', { responseType: 'blob' })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'relatorio-analytics.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
