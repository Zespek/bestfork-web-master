'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiGift, FiSettings, FiEye, FiStar, FiFileText, FiX } from 'react-icons/fi'
import { IReward, RewardType, REWARD_TYPE_LABELS, RewardStatus, REWARD_STATUS_LABELS } from '@bestfork/shared'
import { listRewards, updateReward } from '@/services/rewards.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './rewards.module.css'

const PER_PAGE = 10

function statusBadgeClass(status: RewardStatus) {
  switch (status) {
    case RewardStatus.AVAILABLE:
      return styles.badgeActive
    case RewardStatus.REDEEMED:
      return styles.badgeRedeemed
    case RewardStatus.EXPIRED:
      return styles.badgeExpired
    default:
      return ''
  }
}

export default function RewardsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<RewardType | ''>('')
  const [page, setPage] = useState(1)
  const [selectedReward, setSelectedReward] = useState<IReward | null>(null)
  const [redeemError, setRedeemError] = useState<string | null>(null)

  // Mesmo debounce já usado nas outras listas.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rewards', debouncedSearch, typeFilter, page],
    queryFn: () =>
      listRewards({
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        page,
        perPage: PER_PAGE,
      }),
  })

  const redeemMutation = useMutation({
    mutationFn: (id: string) => updateReward(id, { status: RewardStatus.REDEEMED }),
    onSuccess: (updated) => {
      setRedeemError(null)
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      setSelectedReward(updated)
    },
    onError: (error) => setRedeemError(extractErrorMessage(error, 'Não foi possível marcar o prêmio como resgatado. Tente novamente.')),
  })

  const rewards = data?.data ?? []
  const meta = data?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Resgate de Pontos</h1>
          <p className={styles.subtitle}>
            Gestão de regras de acúmulo automático, campanhas e Prêmios
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/rewards/new" className={styles.buttonPrimary}>
            <FiGift size={18} />
            <span>Gerar Prêmio</span>
          </Link>
        </div>
      </div>

      {/* Campanhas e Regras — informativo, sem motor de automação por trás ainda */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FiSettings /> Campanhas de Pontuação</h2>
        <div className={styles.card}>
          <div className={styles.campaignGrid}>
            <div className={styles.campaignCard}>
              <div className={styles.campaignHeader}>
                <div className={styles.campaignTitle}>
                  <FiStar color="var(--color-gold)" /> Campanha Ouro Automática
                </div>
              </div>
              <div className={styles.campaignDesc}>Gera um Prêmio de R$ 100 automaticamente quando o cliente atinge a meta. A pontuação é zerada após a geração.</div>
              <div className={styles.campaignRule}>
                A cada 2.000 pontos acumulados = R$ 100,00
              </div>
            </div>

            <div className={styles.campaignCard}>
              <div className={styles.campaignHeader}>
                <div className={styles.campaignTitle}>
                  <FiGift color="var(--color-gold)" /> Prêmio de Aniversário
                </div>
              </div>
              <div className={styles.campaignDesc}>Gera um Prêmio especial no mês de aniversário do cliente (enviado via app e email).</div>
              <div className={styles.campaignRule}>
                Validade: 1 mês a partir do envio
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico e Listagem */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FiFileText /> Prêmios Gerados</h2>
        <div className={styles.card}>
          {redeemError && (
            <p style={{ color: 'var(--color-error)', fontSize: 13, padding: '16px 24px 0' }} role="alert">
              {redeemError}
            </p>
          )}
          <div className={styles.filterSection}>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Buscar por cliente ou código..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as RewardType | '')
                setPage(1)
              }}
            >
              <option value="">Todos os Tipos</option>
              {Object.values(RewardType).map((type) => (
                <option key={type} value={type}>
                  {REWARD_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Cliente Beneficiado</th>
                  <th>Prêmio / Desconto</th>
                  <th>Data de Geração</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                      Carregando prêmios...
                    </td>
                  </tr>
                )}

                {isError && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                      Não foi possível carregar os prêmios. Tente novamente.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && rewards.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={styles.codeBox}>{item.code}</span>
                    </td>
                    <td>
                      <span className={`${styles.typeBadge} ${item.type === RewardType.VOUCHER ? styles.typeVoucher : styles.typePrimeGift}`}>
                        Prêmio
                      </span>
                    </td>
                    <td>{item.customerName}</td>
                    <td style={{ color: 'var(--color-gold-dark)', fontWeight: 700 }}>{item.description}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className={`${styles.badge} ${statusBadgeClass(item.status)}`}>
                        {REWARD_STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                        <button className={styles.iconButton} title="Ver Detalhes" onClick={() => setSelectedReward(item)}>
                          <FiEye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!isLoading && !isError && rewards.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                      Nenhum item encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.lastPage > 1 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Página {meta.page} de {meta.lastPage} ({meta.total} prêmios)
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

      {/* Modal: Ver Detalhes */}
      {selectedReward && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedReward.code}</h2>
              <button className={styles.closeButton} onClick={() => setSelectedReward(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cliente</label>
              <p>{selectedReward.customerName}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo</label>
              <p>{REWARD_TYPE_LABELS[selectedReward.type]}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prêmio / Desconto</label>
              <p>{selectedReward.description}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Validade</label>
              <p>{new Date(selectedReward.expiresAt).toLocaleDateString('pt-BR')}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <span className={`${styles.badge} ${statusBadgeClass(selectedReward.status)}`}>
                {REWARD_STATUS_LABELS[selectedReward.status]}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <button
                className={styles.buttonSecondary}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setSelectedReward(null)}
              >
                Fechar
              </button>
              {selectedReward.status === RewardStatus.AVAILABLE && (
                <button
                  className={styles.buttonPrimary}
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={redeemMutation.isPending}
                  onClick={() => redeemMutation.mutate(selectedReward.id)}
                >
                  {redeemMutation.isPending ? 'Salvando...' : 'Marcar como Resgatado'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
