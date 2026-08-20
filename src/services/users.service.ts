import { ICreateUserRequest, IPaginatedResponse, IUpdateUserRequest, IUser } from '@bestfork/shared'
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

export interface ListUsersParams {
  search?: string
  page?: number
  perPage?: number
}

export interface CreateUserResult {
  user: IUser
  /** Só vem preenchido fora de produção — atalho pra testar sem inbox real. */
  devSetPasswordLink?: string
}

export async function listUsers(params: ListUsersParams = {}): Promise<IPaginatedResponse<IUser>> {
  const { data } = await api.get<PaginatedEnvelope<IUser>>('/api/v1/users', { params })

  return { data: data.data, meta: data.meta }
}

export async function getUser(id: string): Promise<IUser> {
  const { data } = await api.get<ApiEnvelope<IUser>>(`/api/v1/users/${id}`)

  return data.data
}

export async function createUser(input: ICreateUserRequest): Promise<CreateUserResult> {
  const { data } = await api.post<ApiEnvelope<CreateUserResult>>('/api/v1/users', input)

  return data.data
}

export async function updateUser(id: string, input: IUpdateUserRequest): Promise<IUser> {
  const { data } = await api.patch<ApiEnvelope<IUser>>(`/api/v1/users/${id}`, input)

  return data.data
}
