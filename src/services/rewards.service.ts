import { ICreateRewardRequest, IPaginatedResponse, IReward, IUpdateRewardRequest, RewardType } from '@bestfork/shared'
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

export interface ListRewardsParams {
  search?: string
  type?: RewardType
  page?: number
  perPage?: number
}

export async function listRewards(params: ListRewardsParams = {}): Promise<IPaginatedResponse<IReward>> {
  const { data } = await api.get<PaginatedEnvelope<IReward>>('/api/v1/rewards', { params })

  return { data: data.data, meta: data.meta }
}

export async function createReward(input: ICreateRewardRequest): Promise<IReward> {
  const { data } = await api.post<ApiEnvelope<IReward>>('/api/v1/rewards', input)

  return data.data
}

export async function updateReward(id: string, input: IUpdateRewardRequest): Promise<IReward> {
  const { data } = await api.patch<ApiEnvelope<IReward>>(`/api/v1/rewards/${id}`, input)

  return data.data
}
