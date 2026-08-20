export enum EventType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.PUBLIC]: 'Público',
  [EventType.PRIVATE]: 'Privado',
}
