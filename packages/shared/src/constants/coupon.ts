export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export const COUPON_DISCOUNT_TYPE_LABELS: Record<CouponDiscountType, string> = {
  [CouponDiscountType.PERCENTAGE]: 'Porcentagem (%)',
  [CouponDiscountType.FIXED]: 'Valor Fixo (R$)',
}
