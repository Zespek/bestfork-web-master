import { ICreateEventSpaceRequest, IEventSpace, IUpdateEventSpaceRequest } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export async function listEventSpaces(restaurantId: string): Promise<IEventSpace[]> {
  const { data } = await api.get<ApiEnvelope<IEventSpace[]>>(`/api/v1/restaurants/${restaurantId}/event-spaces`)

  return data.data
}

export async function createEventSpace(
  restaurantId: string,
  input: ICreateEventSpaceRequest,
): Promise<IEventSpace> {
  const { data } = await api.post<ApiEnvelope<IEventSpace>>(
    `/api/v1/restaurants/${restaurantId}/event-spaces`,
    input,
  )

  return data.data
}

export async function updateEventSpace(
  restaurantId: string,
  spaceId: string,
  input: IUpdateEventSpaceRequest,
): Promise<IEventSpace> {
  const { data } = await api.patch<ApiEnvelope<IEventSpace>>(
    `/api/v1/restaurants/${restaurantId}/event-spaces/${spaceId}`,
    input,
  )

  return data.data
}

export async function deleteEventSpace(restaurantId: string, spaceId: string): Promise<void> {
  await api.delete(`/api/v1/restaurants/${restaurantId}/event-spaces/${spaceId}`)
}
