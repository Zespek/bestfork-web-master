'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiMapPin } from 'react-icons/fi'
import { listRestaurants, updateRestaurant } from '@/services/restaurants.service'
import styles from './restaurants.module.css'

export default function RestaurantsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => listRestaurants(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateRestaurant(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    },
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Casas</h1>
          <p className={styles.subtitle}>
            Gerencie os restaurantes parceiros, seus dados e acessos
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/restaurants/new" className={styles.buttonPrimary}>
            <FiPlus size={18} />
            <span>Adicionar Casa</span>
          </Link>
        </div>
      </div>

      {isLoading && <p style={{ color: 'var(--color-gray-500)' }}>Carregando casas...</p>}

      {!isLoading && restaurants.length === 0 && (
        <div className={styles.emptyState}>Nenhuma casa cadastrada ainda.</div>
      )}

      <div className={styles.restaurantGrid}>
        {restaurants.map((rest) => {
          const location = [rest.city, rest.state].filter(Boolean).join(', ')

          return (
            <div
              key={rest.id}
              className={styles.restaurantCard}
              onClick={() => router.push(`/restaurants/${rest.id}`)}
            >
              <div className={styles.restaurantHeader}>
                <div className={styles.restaurantLogo}>{rest.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className={styles.restaurantInfo}>
                      <h3>{rest.name}</h3>
                      <p>{rest.ownerName ?? '—'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`${styles.statusBadge} ${rest.isActive ? styles.statusActive : styles.statusInactive}`}
                      >
                        {rest.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      <label className={styles.switch} title={rest.isActive ? 'Inativar casa' : 'Ativar casa'}>
                        <input
                          type="checkbox"
                          checked={rest.isActive}
                          disabled={toggleActiveMutation.isPending}
                          onChange={() => toggleActiveMutation.mutate({ id: rest.id, isActive: !rest.isActive })}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-gray-500)', fontSize: 13, marginBottom: 16 }}>
                  <FiMapPin size={14} />
                  {location}
                </div>
              )}

              <div className={styles.restaurantStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{rest.staffCount ?? '—'}</span>
                  <span className={styles.statLabel}>Colaboradores</span>
                </div>
                <div className={styles.statItem} style={{ textAlign: 'right' }}>
                  <span className={styles.statValue}>—</span>
                  <span className={styles.statLabel}>Favoritos</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
