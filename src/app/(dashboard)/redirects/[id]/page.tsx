'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { RedirectStatus } from '@bestfork/shared'
import { getRedirect, updateRedirect } from '@/services/redirects.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from '../new/new-redirect.module.css'

const editRedirectSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  url: z.string().url('Informe uma URL válida.'),
  status: z.nativeEnum(RedirectStatus),
})

type EditRedirectFormInputs = z.infer<typeof editRedirectSchema>

export default function EditRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const redirectId = params.id as string
  const [formError, setFormError] = useState<string | null>(null)

  const { data: redirect, isLoading, isError } = useQuery({
    queryKey: ['redirects', redirectId],
    queryFn: () => getRedirect(redirectId),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditRedirectFormInputs>({ resolver: zodResolver(editRedirectSchema) })

  // `useForm` não sabe esperar uma promise — só preenche quando os dados chegam.
  useEffect(() => {
    if (redirect) {
      reset({ title: redirect.title, url: redirect.url, status: redirect.status })
    }
  }, [redirect, reset])

  const updateMutation = useMutation({
    mutationFn: (data: EditRedirectFormInputs) => updateRedirect(redirectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] })
      router.push('/redirects')
    },
    onError: (error) => {
      setFormError(extractErrorMessage(error, 'Não foi possível salvar as alterações. Tente novamente.'))
    },
  })

  const onSubmit = (data: EditRedirectFormInputs) => {
    updateMutation.mutate(data)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/redirects" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Editar Link
          </h1>
          <p className={styles.subtitle}>Atualize os dados do redirecionamento selecionado</p>
        </div>
      </div>

      <div className={styles.card}>
        {isLoading && <p style={{ color: 'var(--color-gray-500)' }}>Carregando link...</p>}

        {isError && (
          <div className={styles.formError} role="alert">
            Não foi possível carregar este link. Ele pode ter sido removido.
          </div>
        )}

        {redirect && (
          <form
            onSubmit={(e) => {
              setFormError(null)
              void handleSubmit(onSubmit)(e)
            }}
          >
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                Título do Link
              </label>
              <input type="text" id="title" className={styles.input} {...register('title')} />
              {errors.title && <span className={styles.errorText}>{errors.title.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="url" className={styles.label}>
                URL de Destino
              </label>
              <input type="url" id="url" className={styles.input} {...register('url')} />
              {errors.url && <span className={styles.errorText}>{errors.url.message}</span>}
            </div>

            <div className={styles.formGroup} style={{ maxWidth: '50%' }}>
              <label htmlFor="status" className={styles.label}>
                Status
              </label>
              <select id="status" className={styles.select} {...register('status')}>
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
              <Link href="/redirects" className={styles.buttonSecondary}>
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
