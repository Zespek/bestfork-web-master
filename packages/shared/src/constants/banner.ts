export enum BannerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const BANNER_STATUS_LABELS: Record<BannerStatus, string> = {
  [BannerStatus.ACTIVE]: 'Ativo',
  [BannerStatus.INACTIVE]: 'Inativo',
}
