import { ICreateRestaurantRequest, IRestaurantDetail, IRestaurantListItem, IUpdateRestaurantRequest } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export interface ListRestaurantsParams {
  search?: string
}

export interface CreateRestaurantResult {
  restaurant: IRestaurantDetail
  /** Só vem preenchido fora de produção — atalho pra testar sem inbox real. */
  devSetPasswordLink?: string
}

/**
 * Listagem — alimenta tanto o "Vincular Casas" de `/users` quanto os cards
 * da própria tela `/restaurants`.
 */
export async function listRestaurants(params: ListRestaurantsParams = {}): Promise<IRestaurantListItem[]> {
  const { data } = await api.get<ApiEnvelope<IRestaurantListItem[]>>('/api/v1/restaurants', { params })

  return data.data
}

export async function getRestaurant(id: string): Promise<IRestaurantDetail> {
  const { data } = await api.get<ApiEnvelope<IRestaurantDetail>>(`/api/v1/restaurants/${id}`)

  return data.data
}

export async function createRestaurant(input: ICreateRestaurantRequest): Promise<CreateRestaurantResult> {
  const { data } = await api.post<ApiEnvelope<CreateRestaurantResult>>('/api/v1/restaurants', input)

  return data.data
}

export async function updateRestaurant(id: string, input: IUpdateRestaurantRequest): Promise<IRestaurantDetail> {
  const { data } = await api.patch<ApiEnvelope<IRestaurantDetail>>(`/api/v1/restaurants/${id}`, input)

  return data.data
}
