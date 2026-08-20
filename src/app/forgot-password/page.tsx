'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '@/services/auth.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from '../login/login.module.css'

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
})

type ForgotPasswordFormInputs = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [devResetLink, setDevResetLink] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    setFormError(null)
    setIsLoading(true)

    try {
      const { devResetLink } = await forgotPassword(data.email)
      setDevResetLink(devResetLink ?? null)
      setIsSuccess(true)
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Não foi possível processar o pedido. Tente novamente.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Lado Esquerdo - Imagem (Escondido no Mobile) */}
      <div className={styles.imageSection}>
        <div className={styles.imageOverlay} />
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop"
          alt="Alta Gastronomia"
          className={styles.backgroundImage}
        />
      </div>

      {/* Lado Direito - Formulário */}
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          {/* Logo no topo do formulário */}
          <img
            src="/BFprime_ver.svg"
            alt="BestFork Logo"
            className={styles.formLogo}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />

          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Recuperar Senha</h1>
          <p className={styles.subtitle}>
            Insira seu e-mail administrativo para receber as instruções de recuperação.
          </p>

          {!isSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Input de E-mail */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>E-mail Administrativo</label>
                <div className={styles.inputContainer}>
                  <input
                    type="email"
                    placeholder="admin@bestfork.com.br"
                    className={styles.input}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <span className={styles.errorText}>{errors.email.message}</span>
                )}
              </div>

              {formError && (
                <div className={styles.formError} role="alert">
                  {formError}
                </div>
              )}

              {/* Botão de Submit */}
              <button
                type="submit"
                className={styles.loginButton}
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Link href="/login" className={styles.forgotPassword} style={{ display: 'inline-block' }}>
                  Voltar para o login
                </Link>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <p><strong>Se o e-mail existir em nossa base, enviamos as instruções!</strong></p>
                <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--color-gray-600)' }}>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
              </div>

              {devResetLink && (
                <div
                  style={{
                    backgroundColor: '#f2f2f2',
                    borderRadius: '14px',
                    padding: '16px',
                    marginBottom: '24px',
                    textAlign: 'left',
                    fontSize: '13px',
                  }}
                >
                  <p style={{ fontWeight: 700, marginBottom: '8px' }}>
                    🧪 Modo dev — sem envio de e-mail real ainda:
                  </p>
                  <Link href={devResetLink} style={{ wordBreak: 'break-all', color: 'var(--color-gold)' }}>
                    {devResetLink}
                  </Link>
                </div>
              )}

              <Link href="/login" className={styles.loginButton} style={{ textDecoration: 'none' }}>
                Voltar para o login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
