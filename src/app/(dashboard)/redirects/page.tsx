'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiExternalLink, FiMousePointer, FiCopy, FiCheck } from 'react-icons/fi'
import { RedirectStatus } from '@bestfork/shared'
import { getRedirectPublicUrl, listRedirects, updateRedirect } from '@/services/redirects.service'
import styles from './redirects.module.css'

const PER_PAGE = 10

export default function RedirectsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['redirects', page, searchTerm],
    queryFn: () => listRedirects({ page, perPage: PER_PAGE, search: searchTerm || undefined }),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RedirectStatus }) => updateRedirect(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['redirects'] }),
  })

  const handleCopyLink = async (id: string) => {
    await navigator.clipboard.writeText(getRedirectPublicUrl(id))
    setCopiedId(id)
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000)
  }

  const links = data?.data ?? []
  const meta = data?.meta

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Redirecionamentos</h1>
          <p className={styles.subtitle}>
            Gerencie os links externos e plataformas parceiras integradas ao aplicativo
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/redirects/new" className={styles.buttonPrimary}>
            <FiPlus size={18} />
            <span>Novo Link</span>
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar por título ou URL..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título do Link</th>
                <th>URL de Destino</th>
                <th>Acessos (Cliques)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Carregando links...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                    Não foi possível carregar os links. Tente novamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && links.map((link) => (
                <tr key={link.id}>
                  <td>
                    <div className={styles.linkTitle}>
                      <FiExternalLink size={14} color="var(--color-gold)" />
                      {link.title}
                    </div>
                  </td>
                  <td>
                    <a href={link.url} target="_blank" rel="noreferrer" className={styles.linkUrl}>
                      {link.url}
                    </a>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <FiMousePointer size={14} color="var(--color-gray-500)" />
                      {link.clicks.toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${link.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                      {link.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                      <button
                        className={styles.iconButton}
                        title="Copiar link de redirecionamento"
                        onClick={() => handleCopyLink(link.id)}
                      >
                        {copiedId === link.id ? <FiCheck size={16} /> : <FiCopy size={16} />}
                      </button>
                      <Link href={`/redirects/${link.id}`} className={styles.iconButton} title="Editar">
                        <FiEdit2 size={16} />
                      </Link>
                      <button
                        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                        title={link.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                        disabled={toggleStatusMutation.isPending}
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: link.id,
                            status: link.status === 'ACTIVE' ? RedirectStatus.INACTIVE : RedirectStatus.ACTIVE,
                          })
                        }
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && !isError && links.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    {searchTerm ? `Nenhum link encontrado com "${searchTerm}".` : 'Nenhum link cadastrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.lastPage > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {meta.page} de {meta.lastPage} ({meta.total} links)
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
  )
}
