import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, LoginRequest, RegisterRequest, TokenPair } from '@/lib/types'
import api from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Normalize the user object returned by the backend so its `role` is lowercase. */
function normalizeUser(raw: Record<string, unknown>): User {
  return {
    ...raw,
    role: String(raw.role).toLowerCase() as User['role'],
  } as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const setUserAndPersist = useCallback((u: User | null) => {
    setUser(u)
    if (u) {
      localStorage.setItem('user', JSON.stringify(u))
    } else {
      localStorage.removeItem('user')
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      const normalized = normalizeUser(res.data)
      setUserAndPersist(normalized)
    } catch {
      setUserAndPersist(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }, [setUserAndPersist])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(normalizeUser(parsed))
        // Refresh user data in background
        refreshUser()
      } catch {
        setUser(null)
      }
    }
    setIsLoading(false)
  }, [refreshUser])

  const setTokens = (tokens: TokenPair) => {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
  }

  const login = useCallback(async (data: LoginRequest) => {
    const res = await api.post('/auth/login', data)
    const { user: userData, tokens } = res.data
    setTokens(tokens)
    const normalized = normalizeUser(userData)
    setUserAndPersist(normalized)
  }, [setUserAndPersist])

  const register = useCallback(async (data: RegisterRequest) => {
    await api.post('/auth/register', data)
    // Auto-login after registration
    await login({ email: data.email, password: data.password })
  }, [login])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors
    }
    setUserAndPersist(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }, [setUserAndPersist])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
