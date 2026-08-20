import { ICreateProfileRequest, IModule, IProfile, IUpdateProfilePermissionsRequest } from '@bestfork/shared'
import { api } from '@/lib/api'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export async function listProfiles(): Promise<IProfile[]> {
  const { data } = await api.get<ApiEnvelope<IProfile[]>>('/api/v1/profiles')

  return data.data
}

export async function listModules(): Promise<IModule[]> {
  const { data } = await api.get<ApiEnvelope<IModule[]>>('/api/v1/modules')

  return data.data
}

export async function createProfile(input: ICreateProfileRequest): Promise<IProfile> {
  const { data } = await api.post<ApiEnvelope<IProfile>>('/api/v1/profiles', input)

  return data.data
}

export async function updateProfile(id: string, input: ICreateProfileRequest): Promise<IProfile> {
  const { data } = await api.patch<ApiEnvelope<IProfile>>(`/api/v1/profiles/${id}`, input)

  return data.data
}

export async function updateProfilePermissions(
  id: string,
  input: IUpdateProfilePermissionsRequest,
): Promise<IProfile> {
  const { data } = await api.put<ApiEnvelope<IProfile>>(`/api/v1/profiles/${id}/permissions`, input)

  return data.data
}
