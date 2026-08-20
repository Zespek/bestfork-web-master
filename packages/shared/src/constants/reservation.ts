export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: 'Pendente',
  [ReservationStatus.CONFIRMED]: 'Confirmada',
  [ReservationStatus.CANCELLED]: 'Cancelada',
}
