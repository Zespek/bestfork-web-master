'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { CouponDiscountType } from '@bestfork/shared'
import { createCoupon } from '@/services/loyalty.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './new-reward.module.css'

const newCouponSchema = z.object({
  code: z.string().min(1, 'O código é obrigatório.'),
  discountType: z.nativeEnum(CouponDiscountType),
  value: z.coerce.number({ invalid_type_error: 'Informe um valor válido.' }).positive('O valor deve ser maior que zero.'),
  expiresAt: z.string().min(1, 'A validade é obrigatória.'),
  isActive: z.enum(['ACTIVE', 'INACTIVE']),
})

type NewCouponFormInputs = z.infer<typeof newCouponSchema>

export default function NewCouponPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewCouponFormInputs>({
    resolver: zodResolver(newCouponSchema),
    defaultValues: { discountType: CouponDiscountType.PERCENTAGE, isActive: 'ACTIVE' },
  })

  const discountType = watch('discountType')

  const onSubmit = async (data: NewCouponFormInputs) => {
    setFormError(null)
    setIsLoading(true)

    try {
      await createCoupon({
        code: data.code,
        discountType: data.discountType,
        value: data.value,
        expiresAt: new Date(data.expiresAt).toISOString(),
        isActive: data.isActive === 'ACTIVE',
      })
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'coupons'] })
      router.push('/loyalty')
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Não foi possível cadastrar a premiação. Tente novamente.'))
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/loyalty" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Nova Premiação
          </h1>
          <p className={styles.subtitle}>
            Cadastre um novo cupom ou recompensa para os usuários do aplicativo
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
              <label htmlFor="code" className={styles.label}>
                Código da Premiação / Cupom
              </label>
              <input
                type="text"
                id="code"
                className={styles.input}
                placeholder="Ex: VIP100"
                style={{ textTransform: 'uppercase' }}
                {...register('code')}
              />
              {errors.code && <span className={styles.errorText}>{errors.code.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="discountType" className={styles.label}>
                Tipo de Desconto
              </label>
              <select id="discountType" className={styles.select} {...register('discountType')}>
                <option value={CouponDiscountType.PERCENTAGE}>Porcentagem (%)</option>
                <option value={CouponDiscountType.FIXED}>Valor Fixo (R$)</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label htmlFor="value" className={styles.label}>
                Valor do Desconto
              </label>
              <input
                type="number"
                id="value"
                className={styles.input}
                placeholder={discountType === CouponDiscountType.PERCENTAGE ? 'Ex: 20' : 'Ex: 50.00'}
                min="0"
                step={discountType === CouponDiscountType.PERCENTAGE ? '1' : '0.01'}
                {...register('value')}
              />
              {errors.value && <span className={styles.errorText}>{errors.value.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="expiresAt" className={styles.label}>
                Data de Validade
              </label>
              <input type="date" id="expiresAt" className={styles.input} {...register('expiresAt')} />
              {errors.expiresAt && <span className={styles.errorText}>{errors.expiresAt.message}</span>}
            </div>
          </div>

          <div className={styles.formGroup} style={{ maxWidth: '50%' }}>
            <label htmlFor="isActive" className={styles.label}>
              Status
            </label>
            <select id="isActive" className={styles.select} {...register('isActive')}>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </div>

          {formError && (
            <div className={styles.formError} role="alert">
              {formError}
            </div>
          )}

          <div className={styles.formActions}>
            <Link href="/loyalty" className={styles.buttonSecondary}>
              Cancelar
            </Link>
            <button type="submit" className={styles.buttonPrimary} disabled={isLoading}>
              <FiSave size={18} />
              <span>{isLoading ? 'Salvando...' : 'Salvar Premiação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
