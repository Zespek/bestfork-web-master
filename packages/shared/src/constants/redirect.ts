export enum RedirectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const REDIRECT_STATUS_LABELS: Record<RedirectStatus, string> = {
  [RedirectStatus.ACTIVE]: 'Ativo',
  [RedirectStatus.INACTIVE]: 'Inativo',
}
