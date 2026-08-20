'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiGift } from 'react-icons/fi'
import { RewardType } from '@bestfork/shared'
import { createReward } from '@/services/rewards.service'
import { listCustomers } from '@/services/customers.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './new-reward-gen.module.css'

const generateRewardSchema = z.object({
  customerId: z.string().min(1, 'Selecione um cliente.'),
  type: z.nativeEnum(RewardType),
  description: z.string().min(1, 'A descrição/valor do prêmio é obrigatória.'),
  expiresAt: z.string().min(1, 'A data de validade é obrigatória.'),
})

type GenerateRewardFormInputs = z.infer<typeof generateRewardSchema>

export default function GenerateRewardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'for-rewards'],
    queryFn: () => listCustomers({ perPage: 100 }),
  })
  const customers = customersData?.data ?? []

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GenerateRewardFormInputs>({
    resolver: zodResolver(generateRewardSchema),
    defaultValues: { type: RewardType.VOUCHER },
  })

  const type = watch('type')

  const onSubmit = async (data: GenerateRewardFormInputs) => {
    setFormError(null)
    setIsLoading(true)

    try {
      await createReward({
        customerId: data.customerId,
        type: data.type,
        description: data.description,
        expiresAt: new Date(data.expiresAt).toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      router.push('/rewards')
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Não foi possível gerar o prêmio. Tente novamente.'))
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/rewards" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Gerar Prêmio
          </h1>
          <p className={styles.subtitle}>
            Gere um novo prêmio de valor ou prêmio especial para um cliente
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <form
          onSubmit={(e) => {
            setFormError(null)
            void handleSubmit(onSubmit)(e)
          }}
        >
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="customerId" className={styles.label}>
                Cliente
              </label>
              <select id="customerId" className={styles.select} {...register('customerId')}>
                <option value="">Selecione um cliente...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
              {errors.customerId && <span className={styles.errorText}>{errors.customerId.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="type" className={styles.label}>
                Tipo de Prêmio
              </label>
              <select id="type" className={styles.select} {...register('type')}>
                <option value={RewardType.VOUCHER}>Prêmio de Valor</option>
                <option value={RewardType.PRIME_GIFT}>Prêmio Especial</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Descrição / Valor do Prêmio
              </label>
              <input
                type="text"
                id="description"
                className={styles.input}
                placeholder={type === RewardType.VOUCHER ? 'Ex: R$ 100 de Desconto' : 'Ex: Garrafa de Vinho'}
                {...register('description')}
              />
              {errors.description && <span className={styles.errorText}>{errors.description.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="expiresAt" className={styles.label}>
                Data de Validade
              </label>
              <input type="date" id="expiresAt" className={styles.input} {...register('expiresAt')} />
              {errors.expiresAt && <span className={styles.errorText}>{errors.expiresAt.message}</span>}
            </div>
          </div>

          {formError && (
            <div className={styles.formError} role="alert">
              {formError}
            </div>
          )}

          <div className={styles.formActions}>
            <Link href="/rewards" className={styles.buttonSecondary}>
              Cancelar
            </Link>
            <button type="submit" className={styles.buttonPrimary} disabled={isLoading}>
              <FiGift size={18} />
              <span>{isLoading ? 'Gerando...' : 'Gerar Prêmio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
