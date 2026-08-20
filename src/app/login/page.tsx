'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { Role } from '@bestfork/shared'
import { login } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { extractErrorMessage } from '@/lib/http-error'
import styles from './login.module.css'

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
})

type LoginFormInputs = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormInputs) => {
    setFormError(null)
    setIsLoading(true)

    try {
      const { user, token } = await login(data.email, data.password)

      if (user.role !== Role.MASTER) {
        setFormError('Este painel é exclusivo para donos de rede. Use o painel do restaurante.')
        return
      }

      setAuth(user, token)
      router.push('/users') // Rota inicial direto para Usuários do Master
    } catch (error) {
      setFormError(extractErrorMessage(error, 'Não foi possível autenticar. Tente novamente.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Lado Esquerdo - Imagem (Escondido no Mobile) */}
      <div className={styles.imageSection}>
        <div className={styles.imageOverlay} />
        {/* Placeholder para uma imagem de alta gastronomia */}
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

          <p className={styles.subtitle}>
            Acesse o centro de controle da rede BestFork.
          </p>

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

            {/* Input de Senha */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Senha</label>
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
                <span className={styles.errorText}>
                  {errors.password.message}
                </span>
              )}
            </div>

            <Link href="/forgot-password" className={styles.forgotPassword}>
              Esqueceu sua senha?
            </Link>

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
              {isLoading ? 'Autenticando...' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
