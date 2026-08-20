import { ICreateRedirectRequest, IRedirect, IPaginatedResponse, IUpdateRedirectRequest } from '@bestfork/shared'
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

export interface ListRedirectsParams {
  search?: string
  page?: number
  perPage?: number
}

export async function listRedirects(params: ListRedirectsParams = {}): Promise<IPaginatedResponse<IRedirect>> {
  const { data } = await api.get<PaginatedEnvelope<IRedirect>>('/api/v1/redirects', { params })

  return { data: data.data, meta: data.meta }
}

export async function getRedirect(id: string): Promise<IRedirect> {
  const { data } = await api.get<ApiEnvelope<IRedirect>>(`/api/v1/redirects/${id}`)

  return data.data
}

export async function createRedirect(payload: ICreateRedirectRequest): Promise<IRedirect> {
  const { data } = await api.post<ApiEnvelope<IRedirect>>('/api/v1/redirects', payload)

  return data.data
}

export async function updateRedirect(id: string, payload: IUpdateRedirectRequest): Promise<IRedirect> {
  const { data } = await api.patch<ApiEnvelope<IRedirect>>(`/api/v1/redirects/${id}`, payload)

  return data.data
}

/** URL pública e rastreável do link — a que se distribui pra clientes finais clicarem. */
export function getRedirectPublicUrl(id: string): string {
  const baseUrl = api.defaults.baseURL ?? ''

  return `${baseUrl}/api/v1/redirects/${id}/go`
}
