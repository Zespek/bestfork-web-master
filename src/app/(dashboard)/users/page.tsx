'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiShield } from 'react-icons/fi'
import { ROLE_LABELS } from '@bestfork/shared'
import { listUsers, updateUser } from '@/services/users.service'
import styles from './users.module.css'

const PER_PAGE = 10

export default function UsersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  // Evita disparar uma requisição a cada tecla digitada. O reset de página
  // acontece dentro do próprio callback assíncrono do timer — chamar setState
  // direto no corpo do efeito (estado derivado via effect) é o que o lint reprova.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', debouncedSearch, page],
    queryFn: () => listUsers({ search: debouncedSearch || undefined, page, perPage: PER_PAGE }),
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateUser(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()

  const users = data?.data ?? []
  const meta = data?.meta

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuários do Sistema</h1>
          <p className={styles.subtitle}>
            Gerencie os acessos administrativos da rede BestFork Master
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/users/new" className={styles.buttonPrimary}>
            <FiPlus size={18} />
            <span>Novo Usuário</span>
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
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
                <th>Usuário</th>
                <th>Perfil de Acesso</th>
                <th>Status</th>
                <th>Último Login</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    Carregando usuários...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-error)' }}>
                    Não foi possível carregar os usuários. Tente novamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>{getInitials(user.name)}</div>
                      <div>
                        <div className={styles.userName}>{user.name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.roleTag}>
                      <FiShield size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {user.profile?.name ?? ROLE_LABELS[user.role]}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        user.isActive ? styles.badgeActive : styles.badgeInactive
                      }`}
                    >
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>—</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                      <button
                        className={styles.iconButton}
                        title="Editar"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                        title={user.isActive ? 'Inativar' : 'Ativar'}
                        disabled={toggleStatus.isPending}
                        onClick={() => toggleStatus.mutate({ id: user.id, isActive: !user.isActive })}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && !isError && users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gray-500)' }}>
                    {debouncedSearch
                      ? `Nenhum usuário encontrado com "${debouncedSearch}".`
                      : 'Nenhum usuário cadastrado ainda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.lastPage > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              Página {meta.page} de {meta.lastPage} ({meta.total} usuários)
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
    </div>
  )
}
