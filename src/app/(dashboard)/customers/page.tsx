'use client'

import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiUsers, FiDollarSign, FiRefreshCw, FiCalendar, FiDownloadCloud, FiAward, FiX } from 'react-icons/fi'
import { ICustomer, LoyaltyTier, LOYALTY_TIER_LABELS } from '@bestfork/shared'
import { listCustomers, getCustomersSummary, updateCustomer, adjustCustomerPoints, exportCustomers } from '@/services/customers.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './customers.module.css'

const PER_PAGE = 10

function getTierClass(tier: LoyaltyTier | null) {
  switch (tier) {
    case LoyaltyTier.GOLD:
      return styles.tierOuro
    case LoyaltyTier.SILVER:
      return styles.tierPrata
    case LoyaltyTier.BRONZE:
      return styles.tierBronze
    default:
      return styles.tierNone
  }
}

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [exportError, setExportError] = useState<string | null>(null)
  const [pointsModalCustomer, setPointsModalCustomer] = useState<ICustomer | null>(null)
  const [pointsDelta, setPointsDelta] = useState('')
  const [pointsError, setPointsError] = useState<string | null>(null)

  // Mesmo debounce de /users — evita disparar uma requisição a cada tecla digitada.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', debouncedSearch, page],
    queryFn: () => listCustomers({ search: debouncedSearch || undefined, page, perPage: PER_PAGE }),
  })

  const { data: summary } = useQuery({
    queryKey: ['customers', 'summary'],
    queryFn: getCustomersSummary,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateCustomer(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const adjustPointsMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) => adjustCustomerPoints(id, { delta }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setPointsModalCustomer(null)
    },
    onError: (error) => setPointsError(extractErrorMessage(error, 'Não foi possível ajustar os pontos. Tente novamente.')),
  })

  const exportMutation = useMutation({
    mutationFn: () => exportCustomers({ search: debouncedSearch || undefined }),
    onSuccess: () => setExportError(null),
    onError: (error) => setExportError(extractErrorMessage(error, 'Não foi possível exportar o relatório. Tente novamente.')),
  })

  function openPointsModal(customer: ICustomer) {
    setPointsModalCustomer(customer)
    setPointsDelta('')
    setPointsError(null)
  }

  function submitPointsAdjustment() {
    if (!pointsModalCustomer) return

    const delta = Number(pointsDelta)

    if (!delta) {
      setPointsError('Informe uma quantidade de pontos diferente de zero.')
      return
    }

    adjustPointsMutation.mutate({ id: pointsModalCustomer.id, delta })
  }

  const customers = data?.data ?? []
  const meta = data?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Clientes</h1>
          <p className={styles.subtitle}>
            Acompanhe a base de usuários e os hábitos de consumo na rede BestFork
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.buttonSecondary}
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate()}
          >
            <FiDownloadCloud size={18} />
            <span>{exportMutation.isPending ? 'Exportando...' : 'Exportar Relatório'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <p style={{ color: 'var(--color-error)', fontSize: 13 }} role="alert">
          {exportError}
        </p>
      )}

      {/* Dashboard Simples */}
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Clientes Ativos</span>
            <FiUsers className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>{summary?.activeCustomers ?? '—'}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Ticket Médio Geral</span>
            <FiDollarSign className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>—</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Taxa de Retenção</span>
            <FiRefreshCw className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>—</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Frequência Média</span>
            <FiCalendar className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>—</div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className={styles.card}>
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou e-mail..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Pontos</th>
                <th>Nível</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Carregando clientes...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                    Não foi possível carregar os clientes. Tente novamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{c.name}</span>
                      <span className={styles.userEmail}>{c.email}</span>
                    </div>
                  </td>
                  <td>
                    <strong>{c.points.toLocaleString('pt-BR')}</strong>
                  </td>
                  <td>
                    <span className={`${styles.tierTag} ${getTierClass(c.loyaltyTier)}`}>
                      {c.loyaltyTier ? LOYALTY_TIER_LABELS[c.loyaltyTier] : 'Sem nível'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${c.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                      {c.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                      <button className={styles.iconButton} title="Ajustar Pontos" onClick={() => openPointsModal(c)}>
                        <FiAward size={16} />
                      </button>
                      <label className={styles.switch} title={c.isActive ? 'Inativar cliente' : 'Ativar cliente'}>
                        <input
                          type="checkbox"
                          checked={c.isActive}
                          disabled={toggleActiveMutation.isPending}
                          onChange={() => toggleActiveMutation.mutate({ id: c.id, isActive: !c.isActive })}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && !isError && customers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    {debouncedSearch
                      ? `Nenhum cliente encontrado com "${debouncedSearch}".`
                      : 'Nenhum cliente cadastrado ainda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.lastPage > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {meta.page} de {meta.lastPage} ({meta.total} clientes)
            </span>
            <button
              className={styles.paginationButton}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
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

      {/* Modal: Ajustar Pontos */}
      {pointsModalCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Ajustar Pontos</h2>
              <button className={styles.closeButton} onClick={() => setPointsModalCustomer(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cliente</label>
              <p>{pointsModalCustomer.name}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Saldo atual</label>
              <p>{pointsModalCustomer.points.toLocaleString('pt-BR')} pontos</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quantidade a ajustar (use negativo para debitar)</label>
              <input
                type="number"
                className={styles.formInput}
                placeholder="Ex: 500 ou -200"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                autoFocus
              />
            </div>

            {pointsError && <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 16 }}>{pointsError}</p>}

            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <button
                className={styles.buttonSecondary}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setPointsModalCustomer(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.buttonPrimary}
                style={{ flex: 1 }}
                disabled={adjustPointsMutation.isPending}
                onClick={submitPointsAdjustment}
              >
                {adjustPointsMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
