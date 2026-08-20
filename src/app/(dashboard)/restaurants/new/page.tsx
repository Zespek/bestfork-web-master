'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { createRestaurant } from '@/services/restaurants.service'
import { extractErrorMessage } from '@/lib/http-error'
import { formatCnpj, formatPhone, maskOnChange } from '@/lib/masks'
import styles from './new-restaurant.module.css'

const newRestaurantSchema = z.object({
  name: z.string().min(1, 'O nome da casa é obrigatório.'),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  ownerName: z.string().min(1, 'O nome do proprietário é obrigatório.'),
  ownerEmail: z.string().email('Informe um e-mail válido.'),
  ownerPhone: z.string().optional(),
})

type NewRestaurantFormInputs = z.infer<typeof newRestaurantSchema>

export default function NewRestaurantPage() {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [devSetPasswordLink, setDevSetPasswordLink] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewRestaurantFormInputs>({
    resolver: zodResolver(newRestaurantSchema),
  })

  const cnpjField = register('cnpj')
  const ownerPhoneField = register('ownerPhone')

  const onSubmit = async (data: NewRestaurantFormInputs) => {
    setFormError(null)
    setIsLoading(true)

    try {
      const result = await createRestaurant({
        name: data.name,
        cnpj: data.cnpj || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPhone: data.ownerPhone || undefined,
      })
      setDevSetPasswordLink(result.devSetPasswordLink ?? null)
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Não foi possível cadastrar a casa. Tente novamente.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/restaurants" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Adicionar Casa
          </h1>
          <p className={styles.subtitle}>
            Preencha os dados abaixo para cadastrar uma nova casa no sistema
          </p>
        </div>
      </div>

      <div className={styles.card}>
        {devSetPasswordLink ? (
          <div>
            <div className={styles.successPanel}>
              <p><strong>Casa cadastrada com sucesso!</strong></p>
              <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--color-gray-600)' }}>
                Envie o link abaixo para o proprietário definir a própria senha.
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
              <Link href="/restaurants" className={styles.buttonSecondary}>
                Voltar para a lista
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Nome da Casa
                </label>
                <input
                  type="text"
                  id="name"
                  className={styles.input}
                  placeholder="Ex: Giuseppe Grill"
                  {...register('name')}
                />
                {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cnpj" className={styles.label}>
                  CNPJ
                </label>
                <input
                  type="text"
                  id="cnpj"
                  className={styles.input}
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                  {...cnpjField}
                  onChange={maskOnChange(formatCnpj, cnpjField.onChange)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address" className={styles.label}>
                Endereço
              </label>
              <input
                type="text"
                id="address"
                className={styles.input}
                placeholder="Ex: Av. Paulista, 1000"
                {...register('address')}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="city" className={styles.label}>
                  Cidade
                </label>
                <input
                  type="text"
                  id="city"
                  className={styles.input}
                  placeholder="Ex: São Paulo"
                  {...register('city')}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="state" className={styles.label}>
                  UF
                </label>
                <input
                  type="text"
                  id="state"
                  className={styles.input}
                  placeholder="Ex: SP"
                  maxLength={2}
                  {...register('state')}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="ownerName" className={styles.label}>
                  Nome do Proprietário
                </label>
                <input
                  type="text"
                  id="ownerName"
                  className={styles.input}
                  placeholder="Ex: Marcelo Torres"
                  {...register('ownerName')}
                />
                {errors.ownerName && <span className={styles.errorText}>{errors.ownerName.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ownerEmail" className={styles.label}>
                  E-mail do Proprietário
                </label>
                <input
                  type="email"
                  id="ownerEmail"
                  className={styles.input}
                  placeholder="marcelo@giuseppegrill.com"
                  {...register('ownerEmail')}
                />
                {errors.ownerEmail && <span className={styles.errorText}>{errors.ownerEmail.message}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="ownerPhone" className={styles.label}>
                Telefone do Proprietário
              </label>
              <input
                type="text"
                id="ownerPhone"
                className={styles.input}
                placeholder="(11) 99999-9999"
                maxLength={15}
                {...ownerPhoneField}
                onChange={maskOnChange(formatPhone, ownerPhoneField.onChange)}
              />
            </div>

            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}

            <div className={styles.formActions}>
              <Link href="/restaurants" className={styles.buttonSecondary}>
                Cancelar
              </Link>
              <button type="submit" className={styles.buttonPrimary} disabled={isLoading}>
                <FiSave size={18} />
                <span>{isLoading ? 'Salvando...' : 'Salvar Casa'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
