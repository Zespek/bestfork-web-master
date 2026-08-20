import { IPaginatedResponse, IReview } from '@bestfork/shared'
import { api } from '@/lib/api'

interface PaginatedEnvelope<T> {
  success: boolean
  data: T[]
  meta: IPaginatedResponse<T>['meta']
  message?: string
}

export interface ListReviewsParams {
  search?: string
  rating?: number
  sinceDays?: number
  page?: number
  perPage?: number
}

export async function listReviews(params: ListReviewsParams = {}): Promise<IPaginatedResponse<IReview>> {
  const { data } = await api.get<PaginatedEnvelope<IReview>>('/api/v1/reviews', { params })

  return { data: data.data, meta: data.meta }
}

export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/api/v1/reviews/${id}`)
}

export interface ExportReviewsParams {
  search?: string
  rating?: number
  sinceDays?: number
}

/** Baixa o CSV real da lista (respeitando os filtros ativos) e dispara o download no navegador. */
export async function exportReviews(params: ExportReviewsParams = {}): Promise<void> {
  const response = await api.get('/api/v1/reviews/export', { params, responseType: 'blob' })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'avaliacoes.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
