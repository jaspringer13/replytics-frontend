"use client"

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        // Re-set cookie in case it expired
        document.cookie = `user=${storedUser}; path=/; max-age=86400; SameSite=Lax`
      } catch (error) {
        localStorage.removeItem('user')
        document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Hardcoded credentials for now
    if (email === 'jaspringer13@gmail.com' && password === 'admin') {
      const userData: User = {
        email: email,
        name: 'Jake Springer'
      }
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      // Set cookie for middleware (in production, this would be an HTTP-only cookie set by the server)
      document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=86400; SameSite=Lax`
      
      // Small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return true
    }
    
    return false
  }

  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
    // Remove cookie
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/auth/signin')
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated }}>
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