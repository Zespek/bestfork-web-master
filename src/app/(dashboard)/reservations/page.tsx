'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiDownloadCloud, FiCalendar, FiClock, FiUsers, FiEye, FiCheck, FiX, FiSave } from 'react-icons/fi'
import { IReservation, ReservationStatus, RESERVATION_STATUS_LABELS } from '@bestfork/shared'
import { listReservations, getReservationsSummary, updateReservation, exportReservations } from '@/services/reservations.service'
import { listRestaurants } from '@/services/restaurants.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './reservations.module.css'

const PER_PAGE = 10

function getStatusBadgeClass(status: ReservationStatus) {
  switch (status) {
    case ReservationStatus.CONFIRMED:
      return styles.badgeConfirmed
    case ReservationStatus.PENDING:
      return styles.badgePending
    case ReservationStatus.CANCELLED:
      return styles.badgeCancelled
    default:
      return ''
  }
}

export default function ReservationsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [restaurantFilter, setRestaurantFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('')
  const [page, setPage] = useState(1)
  const [exportError, setExportError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<IReservation | null>(null)
  const [modalStatus, setModalStatus] = useState<ReservationStatus>(ReservationStatus.PENDING)
  const [modalError, setModalError] = useState<string | null>(null)

  // Mesmo debounce de /users e /customers.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reservations', debouncedSearch, restaurantFilter, statusFilter, page],
    queryFn: () =>
      listReservations({
        search: debouncedSearch || undefined,
        restaurantId: restaurantFilter || undefined,
        status: statusFilter || undefined,
        page,
        perPage: PER_PAGE,
      }),
  })

  const { data: summary } = useQuery({
    queryKey: ['reservations', 'summary'],
    queryFn: getReservationsSummary,
  })

  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => listRestaurants(),
  })

  const exportMutation = useMutation({
    mutationFn: () =>
      exportReservations({
        search: debouncedSearch || undefined,
        restaurantId: restaurantFilter || undefined,
        status: statusFilter || undefined,
      }),
    onSuccess: () => setExportError(null),
    onError: (error) => setExportError(extractErrorMessage(error, 'Não foi possível exportar o relatório. Tente novamente.')),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) => updateReservation(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      setSelectedReservation(null)
    },
    onError: (error) => {
      setModalError(extractErrorMessage(error, 'Não foi possível atualizar a reserva. Tente novamente.'))
    },
  })

  function openDetailsModal(reservation: IReservation) {
    setSelectedReservation(reservation)
    setModalStatus(reservation.status)
    setModalError(null)
  }

  function closeDetailsModal() {
    setSelectedReservation(null)
  }

  const reservations = data?.data ?? []
  const meta = data?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reservas da Rede</h1>
          <p className={styles.subtitle}>
            Acompanhe todas as reservas solicitadas pelos clientes em toda a rede BestFork.
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
            <span>Reservas Hoje</span>
            <FiCalendar className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>{summary?.todayCount ?? '—'}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Pendentes</span>
            <FiClock className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>{summary?.pendingCount ?? '—'}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Pessoas (Hoje)</span>
            <FiUsers className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>{summary?.guestsToday ?? '—'}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Taxa de Ocupação</span>
            <FiCheck className={styles.statIcon} size={20} />
          </div>
          <div className={styles.statValue}>—</div>
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className={styles.card}>
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente ou restaurante..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={restaurantFilter}
            onChange={(e) => {
              setRestaurantFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todas as Unidades</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ReservationStatus | '')
              setPage(1)
            }}
          >
            <option value="">Todos os Status</option>
            {Object.values(ReservationStatus).map((status) => (
              <option key={status} value={status}>
                {RESERVATION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Restaurante</th>
                <th>Data & Hora</th>
                <th>Pessoas</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Carregando reservas...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                    Não foi possível carregar as reservas. Tente novamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{r.customerName}</span>
                      <span className={styles.userEmail}>{r.customerEmail ?? r.customerPhone ?? '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.restaurantTag}>{r.restaurantName}</span>
                  </td>
                  <td>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{format(new Date(r.reservedFor), 'dd/MM/yyyy')}</span>
                      <span className={styles.userEmail}>{format(new Date(r.reservedFor), 'HH:mm')}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiUsers size={16} color="var(--color-gray-500)" />
                      <strong>{r.guests}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${getStatusBadgeClass(r.status)}`}>
                      {RESERVATION_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                      <button className={styles.iconButton} title="Ver Detalhes" onClick={() => openDetailsModal(r)}>
                        <FiEye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && !isError && reservations.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    {debouncedSearch
                      ? `Nenhuma reserva encontrada com "${debouncedSearch}".`
                      : 'Nenhuma reserva cadastrada ainda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.lastPage > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {meta.page} de {meta.lastPage} ({meta.total} reservas)
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

      {/* Modal: Detalhes da Reserva */}
      {selectedReservation && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Detalhes da Reserva</h2>
              <button className={styles.closeButton} onClick={closeDetailsModal}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cliente</label>
              <p style={{ fontWeight: 600 }}>{selectedReservation.customerName}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contato</label>
              <p>{selectedReservation.customerEmail ?? '—'}{selectedReservation.customerPhone ? ` · ${selectedReservation.customerPhone}` : ''}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Restaurante</label>
              <p>{selectedReservation.restaurantName}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Data e Hora</label>
              <p>{format(new Date(selectedReservation.reservedFor), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Pessoas</label>
              <p>{selectedReservation.guests}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mesa</label>
              <p>{selectedReservation.tableLabel ?? 'Não atribuída'}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select
                className={styles.formSelect}
                value={modalStatus}
                onChange={(e) => setModalStatus(e.target.value as ReservationStatus)}
              >
                {Object.values(ReservationStatus).map((status) => (
                  <option key={status} value={status}>
                    {RESERVATION_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {modalError && (
              <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 16 }}>{modalError}</p>
            )}

            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <button
                className={styles.buttonSecondary}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={closeDetailsModal}
              >
                Fechar
              </button>
              <button
                className={styles.buttonSecondary}
                style={{ flex: 1, justifyContent: 'center', backgroundColor: 'var(--color-gold)', color: 'var(--color-white)' }}
                disabled={updateStatusMutation.isPending || modalStatus === selectedReservation.status}
                onClick={() => updateStatusMutation.mutate({ id: selectedReservation.id, status: modalStatus })}
              >
                <FiSave size={16} />
                <span>{updateStatusMutation.isPending ? 'Salvando...' : 'Salvar Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
