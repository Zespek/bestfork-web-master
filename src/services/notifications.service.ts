import { ICreateNotificationCampaignRequest, INotificationCampaign, IPaginatedResponse } from '@bestfork/shared'
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

export interface ListCampaignsParams {
  page?: number
  perPage?: number
}

export async function listCampaigns(params: ListCampaignsParams = {}): Promise<IPaginatedResponse<INotificationCampaign>> {
  const { data } = await api.get<PaginatedEnvelope<INotificationCampaign>>('/api/v1/notifications/campaigns', { params })

  return { data: data.data, meta: data.meta }
}

export async function createCampaign(input: ICreateNotificationCampaignRequest): Promise<INotificationCampaign> {
  const { data } = await api.post<ApiEnvelope<INotificationCampaign>>('/api/v1/notifications/campaigns', input)

  return data.data
}

export async function cancelCampaign(id: string): Promise<INotificationCampaign> {
  const { data } = await api.patch<ApiEnvelope<INotificationCampaign>>(`/api/v1/notifications/campaigns/${id}/cancel`)

  return data.data
}
