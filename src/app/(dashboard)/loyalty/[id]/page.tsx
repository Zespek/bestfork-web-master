'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { CouponDiscountType } from '@bestfork/shared'
import { getCoupon, updateCoupon } from '@/services/loyalty.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from '../new/new-reward.module.css'

const editCouponSchema = z.object({
  code: z.string().min(1, 'O código é obrigatório.'),
  discountType: z.nativeEnum(CouponDiscountType),
  value: z.coerce.number({ invalid_type_error: 'Informe um valor válido.' }).positive('O valor deve ser maior que zero.'),
  expiresAt: z.string().min(1, 'A validade é obrigatória.'),
  isActive: z.enum(['ACTIVE', 'INACTIVE']),
})

type EditCouponFormInputs = z.infer<typeof editCouponSchema>

export default function EditCouponPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const couponId = params.id as string
  const [formError, setFormError] = useState<string | null>(null)

  const { data: coupon, isLoading, isError } = useQuery({
    queryKey: ['loyalty', 'coupons', couponId],
    queryFn: () => getCoupon(couponId),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditCouponFormInputs>({ resolver: zodResolver(editCouponSchema) })

  const discountType = watch('discountType')

  // `useForm` não sabe esperar uma promise — só preenche quando os dados chegam.
  useEffect(() => {
    if (coupon) {
      reset({
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        expiresAt: format(new Date(coupon.expiresAt), 'yyyy-MM-dd'),
        isActive: coupon.isActive ? 'ACTIVE' : 'INACTIVE',
      })
    }
  }, [coupon, reset])

  const updateMutation = useMutation({
    mutationFn: (data: EditCouponFormInputs) =>
      updateCoupon(couponId, {
        code: data.code,
        discountType: data.discountType,
        value: data.value,
        expiresAt: new Date(data.expiresAt).toISOString(),
        isActive: data.isActive === 'ACTIVE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'coupons'] })
      router.push('/loyalty')
    },
    onError: (error) => {
      setFormError(extractErrorMessage(error, 'Não foi possível salvar as alterações. Tente novamente.'))
    },
  })

  const onSubmit = (data: EditCouponFormInputs) => {
    updateMutation.mutate(data)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/loyalty" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Editar Premiação
          </h1>
          <p className={styles.subtitle}>Atualize os dados da premiação selecionada</p>
        </div>
      </div>

      <div className={styles.card}>
        {isLoading && <p style={{ color: 'var(--color-gray-500)' }}>Carregando premiação...</p>}

        {isError && (
          <div className={styles.formError} role="alert">
            Não foi possível carregar esta premiação. Ela pode ter sido removida.
          </div>
        )}

        {coupon && (
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
