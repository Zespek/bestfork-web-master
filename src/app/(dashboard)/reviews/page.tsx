'use client'

import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiDownloadCloud, FiEye, FiTrash2, FiMessageSquare, FiX } from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { IReview } from '@bestfork/shared'
import { listReviews, deleteReview, exportReviews } from '@/services/reviews.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './reviews.module.css'

const PER_PAGE = 10

function renderStars(rating: number) {
  return (
    <div className={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar key={star} size={14} className={star <= rating ? '' : styles.starEmpty} />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [sinceDaysFilter, setSinceDaysFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<IReview | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Mesmo debounce de /customers, /reservations e /events.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews', debouncedSearch, ratingFilter, sinceDaysFilter, page],
    queryFn: () =>
      listReviews({
        search: debouncedSearch || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
        sinceDays: sinceDaysFilter ? Number(sinceDaysFilter) : undefined,
        page,
        perPage: PER_PAGE,
      }),
  })

  const exportMutation = useMutation({
    mutationFn: () =>
      exportReviews({
        search: debouncedSearch || undefined,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
        sinceDays: sinceDaysFilter ? Number(sinceDaysFilter) : undefined,
      }),
    onSuccess: () => setExportError(null),
    onError: (error) => setExportError(extractErrorMessage(error, 'Não foi possível exportar o relatório. Tente novamente.')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      setDeleteError(null)
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error) => setDeleteError(extractErrorMessage(error, 'Não foi possível excluir a avaliação. Tente novamente.')),
  })

  function handleDelete(review: IReview) {
    if (window.confirm(`Excluir a avaliação de "${review.customerName}"? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(review.id)
    }
  }

  const reviews = data?.data ?? []
  const meta = data?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Avaliações</h1>
          <p className={styles.subtitle}>
            Acompanhe o feedback dos clientes e o nível de satisfação nos restaurantes da rede
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

      {(exportError || deleteError) && (
        <p style={{ color: 'var(--color-error)', fontSize: 13 }} role="alert">
          {exportError || deleteError}
        </p>
      )}

      <div className={styles.card}>
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar por restaurante ou cliente..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todas as Notas</option>
            <option value="5">5 Estrelas</option>
            <option value="4">4 Estrelas</option>
            <option value="3">3 Estrelas</option>
            <option value="2">2 Estrelas</option>
            <option value="1">1 Estrela</option>
          </select>
          <select
            className={styles.filterSelect}
            value={sinceDaysFilter}
            onChange={(e) => {
              setSinceDaysFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos os Períodos</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente / Data</th>
                <th>Restaurante</th>
                <th>Nota</th>
                <th>Comentário</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Carregando avaliações...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                    Não foi possível carregar as avaliações. Tente novamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && reviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{r.customerName}</span>
                      <span className={styles.userDate}>
                        {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{r.restaurantName}</strong>
                  </td>
                  <td>{renderStars(r.rating)}</td>
                  <td>
                    <div className={styles.reviewText}>&quot;{r.comment}&quot;</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                      <button className={styles.iconButton} title="Ler Completo" onClick={() => setSelectedReview(r)}>
                        <FiEye size={16} />
                      </button>
                      <button className={styles.iconButton} title="Responder (Em Breve)" disabled>
                        <FiMessageSquare size={16} />
                      </button>
                      <button
                        className={styles.iconButton}
                        title="Moderar/Excluir"
                        style={{ color: '#dc2626' }}
                        onClick={() => handleDelete(r)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && !isError && reviews.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Nenhuma avaliação encontrada com estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.lastPage > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {meta.page} de {meta.lastPage} ({meta.total} avaliações)
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

      {/* Modal: Ler Completo */}
      {selectedReview && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedReview.customerName}</h2>
              <button className={styles.closeButton} onClick={() => setSelectedReview(null)}>
                <FiX size={24} />
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Restaurante</label>
              <p>{selectedReview.restaurantName}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Data</label>
              <p>{new Date(selectedReview.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nota</label>
              {renderStars(selectedReview.rating)}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Comentário</label>
              <p>&quot;{selectedReview.comment}&quot;</p>
            </div>

            <div style={{ display: 'flex', marginTop: 24 }}>
              <button
                className={styles.buttonSecondary}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setSelectedReview(null)}
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
