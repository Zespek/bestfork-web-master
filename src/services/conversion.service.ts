import { IConversionSummary, IImportResult, ILegacyCustomer, IPaginatedResponse } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

interface PaginatedEnvelope<T> {
  success: boolean
  data: T[]
  meta: IPaginatedResponse<T>['meta']
  message?: string
}

export interface ListPendingParams {
  page?: number
  perPage?: number
  minDaysSinceLastVisit?: number
}

export async function getConversionSummary(): Promise<IConversionSummary> {
  const { data } = await api.get<ApiEnvelope<IConversionSummary>>('/api/v1/conversion/summary')

  return data.data
}

export async function listPendingCustomers(params: ListPendingParams = {}): Promise<IPaginatedResponse<ILegacyCustomer>> {
  const { data } = await api.get<PaginatedEnvelope<ILegacyCustomer>>('/api/v1/conversion/pending', { params })

  return { data: data.data, meta: data.meta }
}

export async function importLegacyCsv(file: File): Promise<IImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<ApiEnvelope<IImportResult>>('/api/v1/conversion/import', formData)

  return data.data
}

/** Baixa o CSV real dos clientes pendentes e dispara o download no navegador. */
export async function exportConversionReport(params: ListPendingParams = {}): Promise<void> {
  const response = await api.get('/api/v1/conversion/export', { params, responseType: 'blob' })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'conversao-base-antiga.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
