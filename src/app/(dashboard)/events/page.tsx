'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiPlus, FiEye, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import { EventType, EVENT_TYPE_LABELS, IEvent } from '@bestfork/shared'
import { listEvents, deleteEvent } from '@/services/events.service'
import { listRestaurants } from '@/services/restaurants.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './events.module.css'

const PER_PAGE = 10

export default function EventsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('')
  const [restaurantFilter, setRestaurantFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Mesmo debounce de /users, /customers e /reservations.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', debouncedSearch, typeFilter, restaurantFilter, page],
    queryFn: () =>
      listEvents({
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        restaurantId: restaurantFilter || undefined,
        page,
        perPage: PER_PAGE,
      }),
  })

  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => listRestaurants(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      setDeleteError(null)
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (error) => setDeleteError(extractErrorMessage(error, 'Não foi possível excluir o evento. Tente novamente.')),
  })

  function handleDelete(event: IEvent) {
    if (window.confirm(`Excluir o evento "${event.name}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(event.id)
    }
  }

  const events = data?.data ?? []
  const meta = data?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Eventos</h1>
          <p className={styles.subtitle}>
            Acompanhe e gerencie todos os eventos cadastrados na rede BestFork
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/events/new" className={styles.buttonPrimary}>
            <FiPlus size={18} />
            <span>Novo Evento</span>
          </Link>
        </div>
      </div>

      {deleteError && (
        <p style={{ color: 'var(--color-error)', fontSize: 13 }} role="alert">
          {deleteError}
        </p>
      )}

      <div className={styles.card}>
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar evento ou restaurante..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as EventType | '')
              setPage(1)
            }}
          >
            <option value="">Todos os Tipos</option>
            {Object.values(EventType).map((type) => (
              <option key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={restaurantFilter}
            onChange={(e) => {
              setRestaurantFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos os Restaurantes</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Restaurante</th>
                <th>Data e Hora</th>
                <th>Tipo</th>
                <th>Lotação / Vagas</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Carregando eventos...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                    Não foi possível carregar os eventos. Tente novamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && events.map((event) => {
                const isFull = event.bookedCount >= event.capacity

                return (
                  <tr key={event.id}>
                    <td>
                      <div className={styles.eventInfo}>
                        <span className={styles.eventName}>{event.name}</span>
                        <span className={styles.eventDesc}>{event.description}</span>
                      </div>
                    </td>
                    <td>{event.restaurantName}</td>
                    <td>{format(new Date(event.scheduledFor), "dd/MM/yyyy HH:mm")}</td>
                    <td>
                      <span className={`${styles.badge} ${event.type === EventType.PUBLIC ? styles.badgePublic : styles.badgePrivate}`}>
                        {EVENT_TYPE_LABELS[event.type]}
                      </span>
                    </td>
                    <td>
                      <span className={isFull ? styles.statusFull : styles.statusOpen}>
                        {event.bookedCount} / {event.capacity} {isFull ? '(Esgotado)' : ''}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                        <button className={styles.iconButton} title="Ver Detalhes" onClick={() => setSelectedEvent(event)}>
                          <FiEye size={16} />
                        </button>
                        <button
                          className={styles.iconButton}
                          title="Editar"
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          className={styles.iconButton}
                          title="Excluir"
                          style={{ color: '#dc2626' }}
                          onClick={() => handleDelete(event)}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {!isLoading && !isError && events.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Nenhum evento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.lastPage > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {meta.page} de {meta.lastPage} ({meta.total} eventos)
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

      {/* Modal: Ver Detalhes */}
      {selectedEvent && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedEvent.name}</h2>
              <button className={styles.closeButton} onClick={() => setSelectedEvent(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descrição</label>
              <p>{selectedEvent.description}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Restaurante</label>
              <p>{selectedEvent.restaurantName}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Data e Hora</label>
              <p>{format(new Date(selectedEvent.scheduledFor), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo</label>
              <p>{EVENT_TYPE_LABELS[selectedEvent.type]}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Vagas</label>
              <p>{selectedEvent.bookedCount} / {selectedEvent.capacity}</p>
            </div>

            <div style={{ display: 'flex', marginTop: 24 }}>
              <button
                className={styles.buttonPrimary}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setSelectedEvent(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
