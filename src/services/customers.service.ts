import { IAdjustCustomerPointsRequest, ICustomer, ICustomersSummary, IPaginatedResponse, IUpdateCustomerRequest } from '@bestfork/shared'
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

export interface ListCustomersParams {
  search?: string
  page?: number
  perPage?: number
}

export async function listCustomers(params: ListCustomersParams = {}): Promise<IPaginatedResponse<ICustomer>> {
  const { data } = await api.get<PaginatedEnvelope<ICustomer>>('/api/v1/customers', { params })

  return { data: data.data, meta: data.meta }
}

export async function getCustomersSummary(): Promise<ICustomersSummary> {
  const { data } = await api.get<ApiEnvelope<ICustomersSummary>>('/api/v1/customers/summary')

  return data.data
}

export async function updateCustomer(id: string, input: IUpdateCustomerRequest): Promise<ICustomer> {
  const { data } = await api.patch<ApiEnvelope<ICustomer>>(`/api/v1/customers/${id}`, input)

  return data.data
}

export async function adjustCustomerPoints(id: string, input: IAdjustCustomerPointsRequest): Promise<ICustomer> {
  const { data } = await api.patch<ApiEnvelope<ICustomer>>(`/api/v1/customers/${id}/points`, input)

  return data.data
}

export interface ExportCustomersParams {
  search?: string
}

/** Baixa o CSV real da lista (respeitando a busca ativa) e dispara o download no navegador. */
export async function exportCustomers(params: ExportCustomersParams = {}): Promise<void> {
  const response = await api.get('/api/v1/customers/export', { params, responseType: 'blob' })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'clientes.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
