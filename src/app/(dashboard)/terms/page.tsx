'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiSave, FiX } from 'react-icons/fi'
import { getTerms, updateTerms } from '@/services/terms.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './terms.module.css'

const termsFormSchema = z.object({
  termsText: z.string().min(1, 'O texto dos Termos de Uso não pode ficar vazio.').max(20000),
  privacyText: z.string().min(1, 'O texto da Política de Privacidade não pode ficar vazio.').max(20000),
})

type TermsFormInputs = z.infer<typeof termsFormSchema>

export default function TermsPage() {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['terms'],
    queryFn: getTerms,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TermsFormInputs>({ resolver: zodResolver(termsFormSchema) })

  // `useForm` não sabe esperar uma promise — só preenche os textareas quando os dados chegam.
  useEffect(() => {
    if (data) {
      reset({ termsText: data.termsText, privacyText: data.privacyText })
    }
  }, [data, reset])

  const updateMutation = useMutation({
    mutationFn: (formData: TermsFormInputs) => updateTerms(formData),
    onSuccess: (updated) => {
      queryClient.setQueryData(['terms'], updated)
      reset({ termsText: updated.termsText, privacyText: updated.privacyText })
      setFormError(null)
      setSavedMessage('Termos salvos com sucesso.')
      setTimeout(() => setSavedMessage(null), 3000)
    },
    onError: (error) => setFormError(extractErrorMessage(error, 'Não foi possível salvar os termos. Tente novamente.')),
  })

  const handleCancel = () => {
    if (data) reset({ termsText: data.termsText, privacyText: data.privacyText })
    setFormError(null)
  }

  const onSubmit = (formData: TermsFormInputs) => {
    setFormError(null)
    updateMutation.mutate(formData)
  }

  return (
    <form
      className={styles.container}
      onSubmit={(e) => {
        setFormError(null)
        void handleSubmit(onSubmit)(e)
      }}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Termos de Uso</h1>
          <p className={styles.subtitle}>
            Gerencie os termos de uso e política de privacidade visíveis no aplicativo
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={handleCancel}
            disabled={!isDirty || updateMutation.isPending}
          >
            <FiX size={18} />
            <span>Cancelar</span>
          </button>
          <button type="submit" className={styles.buttonPrimary} disabled={!isDirty || updateMutation.isPending}>
            <FiSave size={18} />
            <span>{updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>

      {isLoading && <p style={{ color: 'var(--color-gray-500)' }}>Carregando termos...</p>}

      {isError && (
        <div className={styles.formError} role="alert">
          Não foi possível carregar os termos. Tente novamente.
        </div>
      )}

      {formError && (
        <div className={styles.formError} role="alert">
          {formError}
        </div>
      )}

      {savedMessage && <div className={styles.formSuccess}>{savedMessage}</div>}

      {data && (
        <div className={styles.card}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="termsText">Termos e Condições de Uso</label>
            <div className={styles.editorContainer}>
              <textarea id="termsText" className={styles.textarea} {...register('termsText')} />
            </div>
            {errors.termsText && <span className={styles.errorText}>{errors.termsText.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="privacyText">Política de Privacidade</label>
            <div className={styles.editorContainer}>
              <textarea id="privacyText" className={styles.textarea} {...register('privacyText')} />
            </div>
            {errors.privacyText && <span className={styles.errorText}>{errors.privacyText.message}</span>}
          </div>

          <span className={styles.metaInfo}>
            Última atualização: {new Date(data.updatedAt).toLocaleString('pt-BR')}
          </span>
        </div>
      )}
    </form>
  )
}
