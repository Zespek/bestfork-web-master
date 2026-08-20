import { IPaginatedResponse, IReservation, IReservationsSummary, IUpdateReservationRequest, ReservationStatus } from '@bestfork/shared'
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

export interface ListReservationsParams {
  search?: string
  restaurantId?: string
  status?: ReservationStatus
  page?: number
  perPage?: number
}

export async function listReservations(
  params: ListReservationsParams = {},
): Promise<IPaginatedResponse<IReservation>> {
  const { data } = await api.get<PaginatedEnvelope<IReservation>>('/api/v1/reservations', { params })

  return { data: data.data, meta: data.meta }
}

export async function getReservationsSummary(): Promise<IReservationsSummary> {
  const { data } = await api.get<ApiEnvelope<IReservationsSummary>>('/api/v1/reservations/summary')

  return data.data
}

export async function getReservation(id: string): Promise<IReservation> {
  const { data } = await api.get<ApiEnvelope<IReservation>>(`/api/v1/reservations/${id}`)

  return data.data
}

export async function updateReservation(id: string, input: IUpdateReservationRequest): Promise<IReservation> {
  const { data } = await api.patch<ApiEnvelope<IReservation>>(`/api/v1/reservations/${id}`, input)

  return data.data
}

export interface ExportReservationsParams {
  search?: string
  restaurantId?: string
  status?: ReservationStatus
}

/** Baixa o CSV real da lista (respeitando os filtros ativos) e dispara o download no navegador. */
export async function exportReservations(params: ExportReservationsParams = {}): Promise<void> {
  const response = await api.get('/api/v1/reservations/export', { params, responseType: 'blob' })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'reservas.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
