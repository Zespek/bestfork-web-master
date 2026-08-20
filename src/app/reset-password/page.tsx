'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { resetPassword } from '@/services/auth.service'
import { extractErrorMessage } from '@/lib/http-error'
import styles from '../login/login.module.css'

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

type ResetPasswordFormInputs = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const token = useSearchParams().get('token')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    if (!token) return

    setFormError(null)
    setIsLoading(true)

    try {
      await resetPassword(token, data.password)
      setIsSuccess(true)
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Não foi possível redefinir a senha. Tente novamente.'))
    } finally {
      setIsLoading(false)
    }
  }

  // Sem token na URL: nem tenta mostrar o form, já orienta a pedir um link novo.
  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <div
          style={{
            backgroundColor: '#fdecec',
            border: '1.5px solid var(--color-error)',
            color: 'var(--color-error)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '24px',
            fontWeight: 600,
          }}
        >
          Link inválido. Solicite um novo link de recuperação.
        </div>
        <Link href="/forgot-password" className={styles.loginButton} style={{ textDecoration: 'none' }}>
          Solicitar novo link
        </Link>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <p><strong>Senha redefinida com sucesso!</strong></p>
          <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--color-gray-600)' }}>Já pode entrar no painel com a nova senha.</p>
        </div>
        <Link href="/login" className={styles.loginButton} style={{ textDecoration: 'none' }}>
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Input de Nova Senha */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Nova Senha</label>
        <div className={styles.inputContainer}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={styles.input}
            {...register('password')}
          />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}
          </button>
        </div>
        {errors.password && (
          <span className={styles.errorText}>{errors.password.message}</span>
        )}
      </div>

      {/* Input de Confirmação */}
      <div className={styles.inputGroup}>
        <label className={styles.label}>Confirmar Nova Senha</label>
        <div className={styles.inputContainer}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={styles.input}
            {...register('confirmPassword')}
          />
        </div>
        {errors.confirmPassword && (
          <span className={styles.errorText}>{errors.confirmPassword.message}</span>
        )}
      </div>

      {formError && (
        <div className={styles.formError} role="alert">
          {formError}
        </div>
      )}

      <button
        type="submit"
        className={styles.loginButton}
        disabled={isLoading}
      >
        {isLoading ? 'Salvando...' : 'Redefinir senha'}
      </button>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link href="/login" className={styles.forgotPassword} style={{ display: 'inline-block' }}>
          Voltar para o login
        </Link>
      </div>
    </form>
  )
}

export default function ResetPasswordPage() {
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

          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Definir Nova Senha</h1>
          <p className={styles.subtitle}>
            Escolha uma nova senha para acessar o painel.
          </p>

          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
