'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { getUser, updateUser } from '@/services/users.service'
import { listProfiles } from '@/services/profiles.service'
import { listRestaurants } from '@/services/restaurants.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from '../new/new-user.module.css'

const editUserSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Informe um e-mail válido.'),
  profileId: z.string().optional(),
  restaurantIds: z.array(z.string()),
  isActive: z.enum(['ACTIVE', 'INACTIVE']),
})

type EditUserFormInputs = z.infer<typeof editUserSchema>

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = params.id as string
  const [formError, setFormError] = useState<string | null>(null)

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUser(userId),
  })

  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: listProfiles })
  const { data: restaurants = [] } = useQuery({ queryKey: ['restaurants'], queryFn: () => listRestaurants() })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditUserFormInputs>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { restaurantIds: [] },
  })

  // Só preenche o form quando os dados chegam — useForm não sabe esperar uma promise.
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        profileId: user.profile?.id ?? '',
        restaurantIds: user.restaurantAccess?.map((restaurant) => restaurant.id) ?? [],
        isActive: user.isActive ? 'ACTIVE' : 'INACTIVE',
      })
    }
  }, [user, reset])

  const updateMutation = useMutation({
    mutationFn: (data: EditUserFormInputs) =>
      updateUser(userId, {
        name: data.name,
        email: data.email,
        profileId: data.profileId || undefined,
        restaurantIds: data.restaurantIds,
        isActive: data.isActive === 'ACTIVE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Trocar o cargo do usuário muda quantos usuários cada cargo tem
      // vinculado — "Níveis de Permissão" depende desse número.
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      router.push('/users')
    },
    onError: (error) => {
      setFormError(extractErrorMessage(error, 'Não foi possível salvar as alterações. Tente novamente.'))
    },
  })

  const onSubmit = (data: EditUserFormInputs) => {
    setFormError(null)
    updateMutation.mutate(data)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/users" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Editar Usuário
          </h1>
          <p className={styles.subtitle}>Atualize os dados do usuário selecionado</p>
        </div>
      </div>

      <div className={styles.card}>
        {isLoading && <p style={{ color: 'var(--color-gray-500)' }}>Carregando usuário...</p>}

        {isError && (
          <div className={styles.formError} role="alert">
            Não foi possível carregar este usuário. Ele pode ter sido removido.
          </div>
        )}

        {user && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Nome Completo
                </label>
                <input type="text" id="name" className={styles.input} {...register('name')} />
                {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  E-mail
                </label>
                <input type="email" id="email" className={styles.input} {...register('email')} />
                {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="profileId" className={styles.label}>
                  Perfil de Acesso
                </label>
                <select id="profileId" className={styles.select} {...register('profileId')}>
                  <option value="">Selecione um cargo...</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="isActive" className={styles.label}>
                  Status
                </label>
                <select id="isActive" className={styles.select} {...register('isActive')}>
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Vincular Casas</label>
              <Controller
                control={control}
                name="restaurantIds"
                render={({ field }) => (
                  <div
                    style={{
                      backgroundColor: 'var(--color-gray-50)',
                      borderRadius: 'var(--border-radius-lg)',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {restaurants.length === 0 && (
                      <span style={{ fontSize: 14, color: 'var(--color-gray-500)' }}>
                        Nenhuma casa cadastrada ainda.
                      </span>
                    )}
                    {restaurants.map((restaurant) => (
                      <label
                        key={restaurant.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(restaurant.id)}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...field.value, restaurant.id]
                                : field.value.filter((id) => id !== restaurant.id),
                            )
                          }}
                        />
                        {restaurant.name}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}

            <div className={styles.formActions}>
              <Link href="/users" className={styles.buttonSecondary}>
                Cancelar
              </Link>
              <button type="submit" className={styles.buttonPrimary} disabled={updateMutation.isPending}>
                <FiSave size={18} />
                <span>{updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
