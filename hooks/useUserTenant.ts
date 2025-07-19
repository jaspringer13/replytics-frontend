import { useAuth } from '@/contexts/AuthContext'

export function useUserTenant() {
  const { tenantId } = useAuth()
  
  return {
    tenantId,
    isLoading: false,
    error: null
  }
}