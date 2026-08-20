'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSend, FiClock, FiList, FiBell, FiTrash2 } from 'react-icons/fi'
import {
  LoyaltyTier,
  LOYALTY_TIER_LABELS,
  NotificationSendMode,
  NOTIFICATION_SEND_MODE_LABELS,
  NotificationCampaignStatus,
  NOTIFICATION_CAMPAIGN_STATUS_LABELS,
  INotificationCampaign,
} from '@bestfork/shared'
import { listCampaigns, createCampaign, cancelCampaign } from '@/services/notifications.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './notifications.module.css'

const PER_PAGE = 10

type Audience = 'ALL' | 'BRONZE' | 'SILVER' | 'GOLD' | 'SILVER_GOLD'

const AUDIENCE_TO_TIERS: Record<Audience, LoyaltyTier[]> = {
  ALL: [],
  BRONZE: [LoyaltyTier.BRONZE],
  SILVER: [LoyaltyTier.SILVER],
  GOLD: [LoyaltyTier.GOLD],
  SILVER_GOLD: [LoyaltyTier.SILVER, LoyaltyTier.GOLD],
}

const notificationFormSchema = z
  .object({
    title: z.string().min(1, 'O título é obrigatório'),
    body: z.string().min(1, 'O texto da mensagem é obrigatório'),
    audience: z.enum(['ALL', 'BRONZE', 'SILVER', 'GOLD', 'SILVER_GOLD']),
    sendMode: z.nativeEnum(NotificationSendMode),
    scheduledAt: z.string().optional(),
  })
  .refine((data) => data.sendMode !== NotificationSendMode.SCHEDULED || !!data.scheduledAt, {
    message: 'A data e hora do envio são obrigatórias para envio agendado',
    path: ['scheduledAt'],
  })

type NotificationFormInputs = z.infer<typeof notificationFormSchema>

function formatAudience(tiers: LoyaltyTier[]): string {
  if (tiers.length === 0) return 'Todos os Usuários'
  if (tiers.length === 1) return `Nível ${LOYALTY_TIER_LABELS[tiers[0]]}`

  return `Níveis ${tiers.map((tier) => LOYALTY_TIER_LABELS[tier]).join(' e ')}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeClass(status: NotificationCampaignStatus) {
  switch (status) {
    case NotificationCampaignStatus.SENT:
      return styles.badgeSent
    case NotificationCampaignStatus.CANCELLED:
      return styles.badgeCancelled
    default:
      return styles.badgePending
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<NotificationFormInputs>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: { audience: 'ALL', sendMode: NotificationSendMode.IMMEDIATE },
  })

  const sendMode = watch('sendMode')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', 'campaigns', page],
    queryFn: () => listCampaigns({ page, perPage: PER_PAGE }),
  })

  const createMutation = useMutation({
    mutationFn: (input: NotificationFormInputs) =>
      createCampaign({
        title: input.title,
        body: input.body,
        sendMode: input.sendMode,
        targetTiers: AUDIENCE_TO_TIERS[input.audience],
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      setFormError(null)
      reset({ audience: 'ALL', sendMode: NotificationSendMode.IMMEDIATE, title: '', body: '', scheduledAt: '' })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'campaigns'] })
    },
    onError: (error) => setFormError(extractErrorMessage(error, 'Não foi possível enviar a notificação. Tente novamente.')),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelCampaign(id),
    onMutate: (id) => setCancellingId(id),
    onSettled: () => setCancellingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'campaigns'] })
    },
  })

  const onSubmit = (input: NotificationFormInputs) => {
    setFormError(null)
    createMutation.mutate(input)
  }

  const campaigns = data?.data ?? []
  const meta = data?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notificações Push</h1>
          <p className={styles.subtitle}>
            Envie ou agende mensagens diretas para os dispositivos dos clientes
          </p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Formulário de Envio */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiSend color="var(--color-gold)" /> Nova Notificação
          </div>
          <form
            className={styles.cardBody}
            onSubmit={(e) => {
              setFormError(null)
              void handleSubmit(onSubmit)(e)
            }}
          >
            <div className={styles.inputGroup}>
              <label className={styles.label}>Título da Mensagem</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: Ganhe 20% OFF hoje!"
                {...register('title')}
              />
              {errors.title && <span className={styles.errorText}>{errors.title.message}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Texto da Mensagem</label>
              <textarea
                className={styles.textarea}
                placeholder="Escreva a mensagem que aparecerá na tela do cliente..."
                {...register('body')}
              />
              {errors.body && <span className={styles.errorText}>{errors.body.message}</span>}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Público Alvo (Filtro de Fidelidade)</label>
              <select className={styles.select} {...register('audience')}>
                <option value="ALL">Todos os Usuários Ativos</option>
                <option value="BRONZE">Apenas Nível Bronze</option>
                <option value="SILVER">Apenas Nível Prata</option>
                <option value="GOLD">Apenas Nível Ouro</option>
                <option value="SILVER_GOLD">Níveis Prata e Ouro</option>
              </select>
            </div>

            <div className={styles.inputGroup} style={{ marginTop: '8px' }}>
              <label className={styles.label}>Modo de Envio</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    className={styles.radioInput}
                    value={NotificationSendMode.IMMEDIATE}
                    {...register('sendMode')}
                  />
                  Envio Imediato
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    className={styles.radioInput}
                    value={NotificationSendMode.SCHEDULED}
                    {...register('sendMode')}
                  />
                  Envio Agendado
                </label>
              </div>
            </div>

            {sendMode === NotificationSendMode.SCHEDULED && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Data e Hora do Envio</label>
                <input type="datetime-local" className={styles.input} {...register('scheduledAt')} />
                {errors.scheduledAt && <span className={styles.errorText}>{errors.scheduledAt.message}</span>}
              </div>
            )}

            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button
                type="submit"
                className={styles.buttonPrimary}
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={createMutation.isPending}
              >
                {sendMode === NotificationSendMode.IMMEDIATE ? <FiSend size={18} /> : <FiClock size={18} />}
                <span>
                  {createMutation.isPending
                    ? 'Processando...'
                    : sendMode === NotificationSendMode.IMMEDIATE
                      ? 'Disparar Notificação Agora'
                      : 'Agendar Notificação'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Histórico */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiList color="var(--color-gold)" /> Histórico de Envios
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mensagem</th>
                  <th>Envio</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                      Carregando histórico...
                    </td>
                  </tr>
                )}

                {isError && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                      Não foi possível carregar o histórico. Tente novamente.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && campaigns.map((item: INotificationCampaign) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.notificationTitle}>
                        <FiBell size={12} style={{ marginRight: 6, color: 'var(--color-gold)' }} />
                        {item.title}
                      </div>
                      <div className={styles.notificationTarget}>Alvo: {formatAudience(item.targetTiers)}</div>
                    </td>
                    <td>
                      <div className={styles.typeLabel}>{NOTIFICATION_SEND_MODE_LABELS[item.sendMode].toUpperCase()}</div>
                      <div style={{ fontSize: 12, marginTop: 4, color: 'var(--color-gray-500)' }}>
                        {formatDateTime(item.scheduledAt ?? item.sentAt ?? item.createdAt)}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${statusBadgeClass(item.status)}`}>
                        {NOTIFICATION_CAMPAIGN_STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td>
                      {item.status === NotificationCampaignStatus.SCHEDULED ? (
                        <button
                          className={styles.buttonSecondary}
                          style={{ height: 32, padding: '0 12px', fontSize: 12, color: 'var(--color-error)' }}
                          disabled={cancellingId === item.id}
                          onClick={() => cancelMutation.mutate(item.id)}
                        >
                          <FiTrash2 /> {cancellingId === item.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--color-gray-400)', fontSize: 12 }}>
                          {item.status === NotificationCampaignStatus.CANCELLED ? 'Cancelado' : 'Concluído'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {!isLoading && !isError && campaigns.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                      Nenhuma notificação enviada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.lastPage > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Página {meta.page} de {meta.lastPage} ({meta.total} notificações)
              </span>
              <button className={styles.paginationButton} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </button>
              <button
                className={styles.paginationButton}
                disabled={page >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
