import {
  ICoupon,
  ICreateCouponRequest,
  ILoyaltySettings,
  ILoyaltyTierRule,
  IPaginatedResponse,
  IUpdateCouponRequest,
  IUpdateLoyaltySettingsRequest,
} from '@bestfork/shared'
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

export interface ListCouponsParams {
  search?: string
  page?: number
  perPage?: number
}

export async function listCoupons(params: ListCouponsParams = {}): Promise<IPaginatedResponse<ICoupon>> {
  const { data } = await api.get<PaginatedEnvelope<ICoupon>>('/api/v1/loyalty/coupons', { params })

  return { data: data.data, meta: data.meta }
}

export async function getCoupon(id: string): Promise<ICoupon> {
  const { data } = await api.get<ApiEnvelope<ICoupon>>(`/api/v1/loyalty/coupons/${id}`)

  return data.data
}

export async function createCoupon(input: ICreateCouponRequest): Promise<ICoupon> {
  const { data } = await api.post<ApiEnvelope<ICoupon>>('/api/v1/loyalty/coupons', input)

  return data.data
}

export async function updateCoupon(id: string, input: IUpdateCouponRequest): Promise<ICoupon> {
  const { data } = await api.patch<ApiEnvelope<ICoupon>>(`/api/v1/loyalty/coupons/${id}`, input)

  return data.data
}

export async function getTierRules(): Promise<ILoyaltyTierRule[]> {
  const { data } = await api.get<ApiEnvelope<ILoyaltyTierRule[]>>('/api/v1/loyalty/tier-rules')

  return data.data
}

export async function updateTierRules(rules: ILoyaltyTierRule[]): Promise<ILoyaltyTierRule[]> {
  const { data } = await api.put<ApiEnvelope<ILoyaltyTierRule[]>>('/api/v1/loyalty/tier-rules', { rules })

  return data.data
}

export async function getLoyaltySettings(): Promise<ILoyaltySettings> {
  const { data } = await api.get<ApiEnvelope<ILoyaltySettings>>('/api/v1/loyalty/settings')

  return data.data
}

export async function updateLoyaltySettings(input: IUpdateLoyaltySettingsRequest): Promise<ILoyaltySettings> {
  const { data } = await api.patch<ApiEnvelope<ILoyaltySettings>>('/api/v1/loyalty/settings', input)

  return data.data
}
