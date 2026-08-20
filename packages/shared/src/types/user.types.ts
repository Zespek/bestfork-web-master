import { Role } from '../constants/roles'
import { LoyaltyTier } from '../constants/loyalty'
import { ReservationStatus } from '../constants/reservation'
import { EventType } from '../constants/event'
import { CouponDiscountType } from '../constants/coupon'
import { RewardType, RewardStatus } from '../constants/reward'
import { NotificationSendMode, NotificationCampaignStatus } from '../constants/notification'
import { RedirectStatus } from '../constants/redirect'
import { ChatMessageSender } from '../constants/chat'
import { MenuCategory, MenuItemStatus } from '../constants/menu'
import { BannerStatus } from '../constants/banner'

export interface IUserProfileSummary {
  id: string
  name: string
}

export interface IRestaurantSummary {
  id: string
  name: string
}

/** Item de `GET /api/v1/restaurants` — alimenta tanto "Vincular Casas" quanto os cards de `/restaurants`. */
export interface IRestaurantListItem {
  id: string
  name: string
  slug: string
  isActive: boolean
  ownerName?: string
  city?: string | null
  state?: string | null
  staffCount?: number
}

/**
 * Item de `GET /api/v1/restaurants/public` — endpoint público (sem
 * autenticação), usado pelo app mobile (ex.: escolha de "casa favorita" no
 * cadastro). DTO deliberadamente enxuto: nunca inclui `ownerName`,
 * `isActive`, `staffCount` nem qualquer outro dado administrativo.
 */
export interface IPublicRestaurant {
  id: string
  name: string
  logoUrl: string | null
  specialty: string | null
  city: string | null
  state: string | null
  address: string | null
  hours: string | null
}

export interface IRestaurantOwner {
  id: string
  name: string
  email: string
  phone?: string | null
}

/** Detalhe completo de `GET /api/v1/restaurants/:id` — tela "Casas". */
export interface IRestaurantDetail {
  id: string
  name: string
  slug: string
  cnpj?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  /** Contato público da casa — distinto do telefone de login do proprietário. */
  phone?: string | null
  /** Contato público da casa — distinto do e-mail de login do proprietário. */
  email?: string | null
  specialty?: string | null
  description?: string | null
  logoUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner: IRestaurantOwner
  /** Colaboradores ativos — o único KPI de dashboard com dado real por enquanto. */
  staffCount: number
}

export interface ICreateRestaurantRequest {
  name: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
}

export interface IUpdateRestaurantRequest {
  name?: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  isActive?: boolean
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
}

/** Shape do PATCH de auto-atendimento (`restaurant-profile`) — dedicado, não
 * deriva de `IUpdateRestaurantRequest` (que carrega `cnpj`/`isActive`/
 * `owner*`, inalcançáveis por este schema de propósito). */
export interface IUpdateOwnRestaurantProfileRequest {
  name?: string
  specialty?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  description?: string
}

/** Colaborador de uma casa (role `RESTAURANT`) — distinto do proprietário. */
export interface IRestaurantStaff {
  id: string
  name: string
  email: string
  position?: string | null
  isActive: boolean
}

export interface ICreateStaffRequest {
  name: string
  email: string
  position?: string
}

export interface IUpdateStaffRequest {
  name?: string
  email?: string
  position?: string
  isActive?: boolean
}

export interface IEventSpace {
  id: string
  name: string
  capacity: number
  availableDays: string
}

export interface ICreateEventSpaceRequest {
  name: string
  capacity: number
  availableDays: string
}

export type IUpdateEventSpaceRequest = Partial<ICreateEventSpaceRequest>

export interface IUser {
  id: string
  name: string
  email: string
  role: Role
  /** Cargo dentro do time do Master, com a matriz de permissões por trás. */
  profile?: IUserProfileSummary | null
  /** "Vincular Casas" — a quais restaurantes este usuário tem acesso. */
  restaurantAccess?: IRestaurantSummary[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface INetwork {
  id: string
  name: string
  slug: string
  ownerId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IRestaurant {
  id: string
  name: string
  slug: string
  networkId: string
  ownerId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IAuthResponse {
  user: Omit<IUser, 'createdAt' | 'updatedAt'>
  token: string
}

export interface IForgotPasswordRequest {
  email: string
}

export interface IResetPasswordRequest {
  token: string
  password: string
}

export interface IChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

/** `DELETE /auth/me` — só `role: CLIENT`. Exige a senha atual pra confirmar a exclusão. */
export interface IDeleteAccountRequest {
  password: string
}

/**
 * Auto-cadastro público (`POST /auth/register`, só app mobile — `role`
 * sempre `CLIENT`, nunca aceito do cliente). `favoriteRestaurantId` é
 * opcional — passo "Escolher depois" do fluxo de cadastro.
 */
export interface IRegisterRequest {
  name: string
  email: string
  password: string
  phone: string
  cpf: string
  favoriteRestaurantId?: string
}

export interface INotificationPreferences {
  notifyOnNewReservation: boolean
}

export type IUpdateNotificationPreferencesRequest = INotificationPreferences

export interface ICreateUserRequest {
  name: string
  email: string
  profileId?: string
  restaurantIds?: string[]
}

export interface IUpdateUserRequest {
  name?: string
  email?: string
  profileId?: string
  restaurantIds?: string[]
  isActive?: boolean
}

export interface IModule {
  id: string
  key: string
  name: string
  description?: string | null
}

export interface IProfilePermission {
  moduleId: string
  moduleKey: string
  moduleName: string
  enabled: boolean
}

export interface IProfile {
  id: string
  name: string
  permissions: IProfilePermission[]
  usersCount: number
}

export interface ICreateProfileRequest {
  name: string
}

export interface IUpdateProfilePermissionsRequest {
  permissions: Array<{ moduleId: string; enabled: boolean }>
}

export interface IApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface IPaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    perPage: number
    lastPage: number
  }
}

/**
 * Cliente final (`role: CLIENT`) — tela "Gestão de Clientes". Cadastro real é
 * feito pelo app mobile, não pelo Master; aqui só há leitura + moderação.
 * Sem campos de gasto/pedidos: dependem de um sistema de Pedidos inexistente.
 */
export interface ICustomer {
  id: string
  name: string
  email: string
  phone?: string | null
  /// Ajustado manualmente pelo Master — ver `IAdjustCustomerPointsRequest`.
  points: number
  /// Sempre calculado a partir de `points` contra `ILoyaltyTierRule` — nunca atribuído direto.
  loyaltyTier: LoyaltyTier | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IUpdateCustomerRequest {
  isActive?: boolean
}

export interface IAdjustCustomerPointsRequest {
  delta: number
  reason?: string
}

export interface ICustomersSummary {
  activeCustomers: number
}

/**
 * Reserva de mesa numa casa — tela "Reservas". Sem criação pelo Master: isso
 * é trabalho do balcão do restaurante ou do cliente no mobile, nenhum dos
 * dois existe ainda. O Master só visualiza e modera (muda status).
 */
export interface IReservation {
  id: string
  restaurantId: string
  restaurantName: string
  customerName: string
  customerEmail?: string | null
  customerPhone?: string | null
  reservedFor: string
  guests: number
  status: ReservationStatus
  tableLabel?: string | null
  createdAt: string
  updatedAt: string
}

export interface IUpdateReservationRequest {
  status: ReservationStatus
  /** Só usado pelo auto-atendimento do restaurante ao aprovar. `null` desatribui. */
  tableLabel?: string | null
}

/** Mesa do salão, cadastrada pelo próprio restaurante — tela "Gestão de Reservas". */
export interface IRestaurantTable {
  id: string
  label: string
  capacity: number
  isActive: boolean
  /** `true` se já está atribuída a uma reserva CONFIRMED de hoje. */
  isOccupiedToday: boolean
  createdAt: string
  updatedAt: string
}

export interface ICreateRestaurantTableRequest {
  label: string
  capacity: number
}

export interface IUpdateRestaurantTableRequest {
  label?: string
  capacity?: number
  isActive?: boolean
}

/** Prato do cardápio — tela "Gestão de Menu". `imageUrl` é o caminho relativo
 * servido em `/uploads/menu/...`, nunca o binário. */
export interface IMenuItem {
  id: string
  name: string
  description: string
  category: MenuCategory
  price: number
  status: MenuItemStatus
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

/** Shape dos campos de texto — a requisição real é `multipart/form-data`
 * (o campo `image`, quando presente, viaja fora deste objeto). */
export interface ICreateMenuItemRequest {
  name: string
  description: string
  category: MenuCategory
  price: number
  status?: MenuItemStatus
}

export interface IUpdateMenuItemRequest {
  name?: string
  description?: string
  category?: MenuCategory
  price?: number
  status?: MenuItemStatus
}

/** Banner do carrossel promocional — tela "Banners Carrossel". `imageUrl` é
 * o caminho relativo servido em `/uploads/banners/...`, nunca o binário.
 * `order` define a posição no carrossel (crescente) — nunca enviado pelo
 * formulário de criação/edição, só derivado das ações mover-pra-cima/baixo. */
export interface IBanner {
  id: string
  title: string
  link: string
  status: BannerStatus
  order: number
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

/** A requisição real é `multipart/form-data` (campo `image` viaja fora deste
 * objeto) — a imagem é obrigatória na criação. Sem `status`/`order`: o form
 * de criação não tem esses campos, sempre calculados/default no servidor. */
export interface ICreateBannerRequest {
  title: string
  link: string
}

export interface IUpdateBannerRequest {
  title?: string
  link?: string
  status?: BannerStatus
}

/** Contato da tela "Chat com Clientes" — um cliente com reserva na própria casa. */
export interface IChatContact {
  customerId: string
  customerName: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface IChatMessage {
  id: string
  sender: ChatMessageSender
  text: string
  createdAt: string
}

export interface IConversationDetail {
  customerName: string
  /** Status da reserva mais recente deste cliente nesta casa — pode não haver nenhuma. */
  latestReservationStatus: ReservationStatus | null
  messages: IChatMessage[]
}

export interface ISendChatMessageRequest {
  text: string
}

/**
 * Evento com ticket/inscrição (ex.: "Noite de Vinhos") — tela "Gestão de
 * Eventos". Diferente de `IEventSpace` (espaço físico reservável). Cadastrado
 * direto pelo Master. `bookedCount` é real, mas fica sempre 0 até existir um
 * sistema de inscrição/ticket (nem no mobile ainda).
 */
export interface IEvent {
  id: string
  restaurantId: string
  restaurantName: string
  name: string
  description: string
  type: EventType
  scheduledFor: string
  capacity: number
  bookedCount: number
  price: number | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ICreateEventRequest {
  restaurantId: string
  name: string
  description: string
  type: EventType
  scheduledFor: string
  capacity: number
}

export interface IUpdateEventRequest {
  restaurantId?: string
  name?: string
  description?: string
  type?: EventType
  scheduledFor?: string
  capacity?: number
}

/** Shape dos campos de texto pro auto-atendimento — a requisição real é
 * `multipart/form-data` (campo `image`, quando presente, viaja fora deste
 * objeto). Tipos dedicados, não `ICreateEventRequest`/`IUpdateEventRequest`
 * (que exigem/carregam `restaurantId` — reatribuir a casa de um evento é
 * operação só do Master). `price` opcional: evento sem preço é gratuito. */
export interface ICreateOwnEventRequest {
  name: string
  description: string
  type: EventType
  scheduledFor: string
  capacity: number
  price?: number
}

export interface IUpdateOwnEventRequest {
  name?: string
  description?: string
  type?: EventType
  scheduledFor?: string
  capacity?: number
  price?: number
}

export interface IReservationsSummary {
  todayCount: number
  pendingCount: number
  guestsToday: number
}

/** Home do painel do restaurante — auto-atendimento, escopado à própria casa de quem está logado. */
export interface IRestaurantAccountDashboard {
  restaurantName: string
  reservationsSummary: IReservationsSummary
}

/**
 * Avaliação de um cliente sobre uma casa — tela "Avaliações". Exige conta
 * (diferente de `IReservation`, que aceita reserva sem cadastro). Sem
 * criação/edição pelo Master: quem escreve é o cliente, pelo app mobile
 * (ainda não existe). O Master só visualiza e modera (exclui).
 */
export interface IReview {
  id: string
  restaurantId: string
  restaurantName: string
  customerId: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

/** Cupom de desconto da rede — não vinculado a uma casa específica. */
export interface ICoupon {
  id: string
  code: string
  discountType: CouponDiscountType
  value: number
  /// Real, mas sempre 0 até existir um fluxo de checkout que aplique cupom.
  usageCount: number
  isActive: boolean
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface ICreateCouponRequest {
  code: string
  discountType: CouponDiscountType
  value: number
  expiresAt: string
  isActive?: boolean
}

export interface IUpdateCouponRequest {
  code?: string
  discountType?: CouponDiscountType
  value?: number
  expiresAt?: string
  isActive?: boolean
}

/**
 * Prêmio/voucher gerado manualmente pelo Master para um cliente real — tela
 * "Resgate de Pontos". Sem fluxo de resgate automático ainda.
 */
export interface IReward {
  id: string
  customerId: string
  customerName: string
  type: RewardType
  description: string
  code: string
  status: RewardStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface ICreateRewardRequest {
  customerId: string
  type: RewardType
  description: string
  expiresAt: string
}

export interface IUpdateRewardRequest {
  status: RewardStatus
}

/** Balcão de resgate (web-restaurant) — tela "Validação e Resgate". */
export interface IRedeemRewardRequest {
  code: string
}

export interface IRedemptionResult {
  customerName: string
  type: RewardType
  description: string
}

export interface IRedemptionHistoryItem {
  id: string
  code: string
  type: RewardType
  customerName: string
  description: string
  redeemedAt: string
}

/** Faixa de pontos de um nível de fidelidade — editável pelo Master. */
export interface ILoyaltyTierRule {
  tier: LoyaltyTier
  minPoints: number
  /// `null` = sem limite superior (nível mais alto).
  maxPoints: number | null
}

export interface IUpdateLoyaltyTierRulesRequest {
  rules: ILoyaltyTierRule[]
}

/** Resposta de `GET /api/v1/loyalty/me` — status de fidelidade do próprio usuário logado. */
export interface IMyLoyaltyStatus {
  points: number
  tier: LoyaltyTier | null
  tierRules: ILoyaltyTierRule[]
}

/** Item de `GET /api/v1/loyalty/me/transactions` — extrato do próprio usuário logado. */
export interface IPointsTransaction {
  id: string
  delta: number
  reason: string | null
  balanceAfter: number
  createdAt: string
}

/** Regra "R$ X gasto = Y pontos" — configuração única, editável pelo Master. */
export interface ILoyaltySettings {
  pointsPerCurrencyUnit: number
  updatedAt: string
}

export interface IUpdateLoyaltySettingsRequest {
  pointsPerCurrencyUnit: number
}

/** Campanha de notificação push (popula o inbox in-app do cliente-alvo). */
export interface INotificationCampaign {
  id: string
  title: string
  body: string
  sendMode: NotificationSendMode
  status: NotificationCampaignStatus
  /// `[]` = todos os clientes ativos, sem filtro de nível.
  targetTiers: LoyaltyTier[]
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
}

export interface ICreateNotificationCampaignRequest {
  title: string
  body: string
  sendMode: NotificationSendMode
  targetTiers?: LoyaltyTier[]
  /// Obrigatória quando `sendMode === 'SCHEDULED'`.
  scheduledAt?: string
}

/**
 * Item da inbox in-app de `GET /notifications/me` (ponto de vista do
 * destinatário `CLIENT`, diferente de `INotificationCampaign` que é a visão
 * administrativa do Master). `type` é `string` livre, não union — hoje só
 * `"promo"` é produzido pelo fan-out de campanhas.
 */
export interface INotification {
  id: string
  title: string
  body: string
  type: string
  read: boolean
  createdAt: string
}

export interface IUnreadCountResponse {
  count: number
}

/**
 * Métricas reais da rede — nenhuma depende de Pedidos/Delivery/Gift Card
 * (nunca existiram no backend). `primeRetentionRate` é um proxy: % de
 * clientes ativos com 2+ reservas vinculadas à própria conta.
 */
export interface IAnalyticsSummary {
  reservationsThisMonth: { count: number; changePercent: number | null }
  cancellationRate: { rate: number | null; changePercent: number | null }
  averageReviewRating: { rating: number | null; totalReviews: number }
  rewardsRedeemed: number
  activeCoupons: number
  primeRetentionRate: number | null
  reservationsByMonth: { month: string; count: number }[]
}

/** Os 3 contadores do funil de conversão da base antiga (todos reais, ver módulo `conversion`). */
export interface IConversionSummary {
  totalLegacyBase: number
  migratedToNewApp: number
  pendingMigration: number
}

/** Cliente importado da base antiga, ainda pendente de migração. CPF sempre mascarado. */
export interface ILegacyCustomer {
  id: string
  name: string
  email: string
  cpf: string | null
  phone: string | null
  legacyConsumedTotal: number | null
  legacyLastVisitAt: string | null
}

export interface IImportRowError {
  line: number
  reason: string
}

export interface IImportResult {
  imported: number
  duplicates: number
  errors: IImportRowError[]
}

/** Link externo/parceiro com rastreamento de cliques — tela "Redirecionamentos". */
export interface IRedirect {
  id: string
  title: string
  url: string
  status: RedirectStatus
  clicks: number
  createdAt: string
  updatedAt: string
}

export interface ICreateRedirectRequest {
  title: string
  url: string
}

export interface IUpdateRedirectRequest {
  title?: string
  url?: string
  status?: RedirectStatus
}

/** Termos de Uso + Política de Privacidade — linha única, tela "Termos de Uso". */
export interface ITermsContent {
  termsText: string
  privacyText: string
  updatedAt: string
}

export interface IUpdateTermsRequest {
  termsText?: string
  privacyText?: string
}
