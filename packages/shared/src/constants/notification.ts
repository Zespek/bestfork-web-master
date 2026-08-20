export enum NotificationSendMode {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
}

export const NOTIFICATION_SEND_MODE_LABELS: Record<NotificationSendMode, string> = {
  [NotificationSendMode.IMMEDIATE]: 'Imediato',
  [NotificationSendMode.SCHEDULED]: 'Agendado',
}

export enum NotificationCampaignStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED',
}

export const NOTIFICATION_CAMPAIGN_STATUS_LABELS: Record<NotificationCampaignStatus, string> = {
  [NotificationCampaignStatus.SCHEDULED]: 'Agendado',
  [NotificationCampaignStatus.SENT]: 'Enviado',
  [NotificationCampaignStatus.CANCELLED]: 'Cancelado',
}
