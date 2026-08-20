import { ICreateStaffRequest, IRestaurantStaff, IUpdateStaffRequest } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export interface CreateStaffResult {
  staff: IRestaurantStaff
  /** Só vem preenchido fora de produção — atalho pra testar sem inbox real. */
  devSetPasswordLink?: string
}

export async function listStaff(restaurantId: string): Promise<IRestaurantStaff[]> {
  const { data } = await api.get<ApiEnvelope<IRestaurantStaff[]>>(`/api/v1/restaurants/${restaurantId}/staff`)

  return data.data
}

export async function createStaff(restaurantId: string, input: ICreateStaffRequest): Promise<CreateStaffResult> {
  const { data } = await api.post<ApiEnvelope<CreateStaffResult>>(`/api/v1/restaurants/${restaurantId}/staff`, input)

  return data.data
}

export async function updateStaff(
  restaurantId: string,
  staffId: string,
  input: IUpdateStaffRequest,
): Promise<IRestaurantStaff> {
  const { data } = await api.patch<ApiEnvelope<IRestaurantStaff>>(
    `/api/v1/restaurants/${restaurantId}/staff/${staffId}`,
    input,
  )

  return data.data
}
