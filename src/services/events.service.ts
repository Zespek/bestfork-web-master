import { ICreateEventRequest, IEvent, IPaginatedResponse, IUpdateEventRequest, EventType } from '@bestfork/shared'
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

export interface ListEventsParams {
  search?: string
  restaurantId?: string
  type?: EventType
  page?: number
  perPage?: number
}

export async function listEvents(params: ListEventsParams = {}): Promise<IPaginatedResponse<IEvent>> {
  const { data } = await api.get<PaginatedEnvelope<IEvent>>('/api/v1/events', { params })

  return { data: data.data, meta: data.meta }
}

export async function getEvent(id: string): Promise<IEvent> {
  const { data } = await api.get<ApiEnvelope<IEvent>>(`/api/v1/events/${id}`)

  return data.data
}

export async function createEvent(input: ICreateEventRequest): Promise<IEvent> {
  const { data } = await api.post<ApiEnvelope<IEvent>>('/api/v1/events', input)

  return data.data
}

export async function updateEvent(id: string, input: IUpdateEventRequest): Promise<IEvent> {
  const { data } = await api.patch<ApiEnvelope<IEvent>>(`/api/v1/events/${id}`, input)

  return data.data
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/api/v1/events/${id}`)
}
