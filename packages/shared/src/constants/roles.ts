export enum Role {
  MASTER = 'MASTER',
  RESTAURANT = 'RESTAURANT',
  CLIENT = 'CLIENT',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.MASTER]: 'Master',
  [Role.RESTAURANT]: 'Restaurante',
  [Role.CLIENT]: 'Cliente',
}
