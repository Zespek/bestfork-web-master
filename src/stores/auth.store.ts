import { create } from 'zustand'
import { IAuthResponse } from '@bestfork/shared'
import { me as fetchMe } from '@/services/auth.service'

type SessionUser = IAuthResponse['user']

const TOKEN_KEY = '@bestfork:token'

interface AuthState {
  user: SessionUser | null
  token: string | null
  isAuthenticated: boolean
  /** `true` enquanto a sessão ainda não foi revalidada no boot do app. */
  isLoading: boolean
  setAuth: (user: SessionUser, token: string) => void
  logout: () => void
  /** Revalida o token salvo (se houver) chamando `GET /auth/me`. Rode uma vez no boot. */
  loadSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  loadSession: async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const user = await fetchMe()
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch {
      // Token inválido/expirado ou usuário desativado — o interceptor de 401 do
      // `api.ts` já limpa o localStorage; aqui só sincronizamos o estado da store.
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
