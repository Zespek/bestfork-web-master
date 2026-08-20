/** Rótulo atribuído manualmente pelo Master — não é calculado por um sistema de Pedidos (ainda não existe). */
export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
}

export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  [LoyaltyTier.BRONZE]: 'Bronze',
  [LoyaltyTier.SILVER]: 'Prata',
  [LoyaltyTier.GOLD]: 'Ouro',
}
