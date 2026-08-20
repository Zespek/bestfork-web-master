'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { createRedirect } from '@/services/redirects.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './new-redirect.module.css'

export default function NewRedirectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({ title: '', url: '' })
  const [formError, setFormError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const createMutation = useMutation({
    mutationFn: () => createRedirect(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] })
      router.push('/redirects')
    },
    onError: (error) => setFormError(extractErrorMessage(error, 'Não foi possível criar o link. Tente novamente.')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    createMutation.mutate()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Link href="/redirects" className={styles.backButton} title="Voltar">
              <FiArrowLeft size={24} />
            </Link>
            Novo Link
          </h1>
          <p className={styles.subtitle}>
            Cadastre um novo redirecionamento ou link externo
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Título do Link
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={styles.input}
              placeholder="Ex: Ecommerce BestFork"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="url" className={styles.label}>
              URL de Destino
            </label>
            <input
              type="url"
              id="url"
              name="url"
              className={styles.input}
              placeholder="Ex: https://shop.bestfork.com.br"
              value={formData.url}
              onChange={handleChange}
              required
            />
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
            <button type="submit" className={styles.buttonPrimary} disabled={createMutation.isPending}>
              <FiSave size={18} />
              <span>{createMutation.isPending ? 'Salvando...' : 'Salvar Link'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
