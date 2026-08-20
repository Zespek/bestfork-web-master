'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { createUser } from '@/services/users.service'
import { listProfiles } from '@/services/profiles.service'
import { listRestaurants } from '@/services/restaurants.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './new-user.module.css'

const newUserSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Informe um e-mail válido.'),
  profileId: z.string().optional(),
  restaurantIds: z.array(z.string()),
})

type NewUserFormInputs = z.infer<typeof newUserSchema>

export default function NewUserPage() {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [devSetPasswordLink, setDevSetPasswordLink] = useState<string | null>(null)

  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: listProfiles })
  const { data: restaurants = [] } = useQuery({ queryKey: ['restaurants'], queryFn: () => listRestaurants() })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NewUserFormInputs>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { restaurantIds: [] },
  })

  const onSubmit = async (data: NewUserFormInputs) => {
    setFormError(null)
    setIsLoading(true)

    try {
      const result = await createUser({
        name: data.name,
        email: data.email,
        profileId: data.profileId || undefined,
        restaurantIds: data.restaurantIds,
      })
      setDevSetPasswordLink(result.devSetPasswordLink ?? null)
      // O novo usuário conta pro "Usuários Vinculados" do cargo escolhido,
      // e também deve aparecer na lista de /users quando o admin voltar.
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Não foi possível criar o usuário. Tente novamente.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/users" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Novo Usuário
          </h1>
          <p className={styles.subtitle}>
            Preencha os dados abaixo para cadastrar um novo usuário no sistema
          </p>
        </div>
      </div>

      <div className={styles.card}>
        {devSetPasswordLink ? (
          <div>
            <div className={styles.successPanel}>
              <p><strong>Usuário criado com sucesso!</strong></p>
              <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--color-gray-600)' }}>
                Envie o link abaixo para a pessoa definir a própria senha.
              </p>
            </div>

            <div className={styles.devLinkBox}>
              <p style={{ fontWeight: 700, marginBottom: '8px' }}>
                🧪 Modo dev — sem envio de e-mail real ainda:
              </p>
              <Link href={devSetPasswordLink} style={{ color: 'var(--color-gold)' }}>
                {devSetPasswordLink}
              </Link>
            </div>

            <div className={styles.formActions}>
              <Link href="/users" className={styles.buttonSecondary}>
                Voltar para a lista
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  className={styles.input}
                  placeholder="Ex: João da Silva"
                  {...register('name')}
                />
                {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  placeholder="joao.silva@bestfork.com"
                  {...register('email')}
                />
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
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Vincular Casas</label>
              <Controller
                control={control}
                name="restaurantIds"
                render={({ field }) => (
                  <div
                    style={{
                      border: '2px solid transparent',
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
              <button type="submit" className={styles.buttonPrimary} disabled={isLoading}>
                <FiSave size={18} />
                <span>{isLoading ? 'Salvando...' : 'Salvar Usuário'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
