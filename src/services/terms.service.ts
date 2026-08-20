import { ITermsContent, IUpdateTermsRequest } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export async function getTerms(): Promise<ITermsContent> {
  const { data } = await api.get<ApiEnvelope<ITermsContent>>('/api/v1/terms')

  return data.data
}

export async function updateTerms(payload: IUpdateTermsRequest): Promise<ITermsContent> {
  const { data } = await api.patch<ApiEnvelope<ITermsContent>>('/api/v1/terms', payload)

  return data.data
}
