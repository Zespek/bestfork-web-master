export enum RewardType {
  VOUCHER = 'VOUCHER',
  PRIME_GIFT = 'PRIME_GIFT',
}

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  [RewardType.VOUCHER]: 'Prêmio de Valor',
  [RewardType.PRIME_GIFT]: 'Prêmio Especial',
}

/**
 * `EXPIRED` nunca é gravado no banco — é calculado na resposta da API quando
 * `expiresAt` já passou e o prêmio segue `AVAILABLE` (ver `rewards.service.ts`).
 */
export enum RewardStatus {
  AVAILABLE = 'AVAILABLE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
}

export const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  [RewardStatus.AVAILABLE]: 'Disponível',
  [RewardStatus.REDEEMED]: 'Resgatado',
  [RewardStatus.EXPIRED]: 'Expirado',
}
