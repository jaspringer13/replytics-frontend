import { useAuth } from '@/contexts/AuthContext'

export function useUserTenant() {
  const { tenantId, isLoading, isTokenExpired } = useAuth()
  
  // Determine error state based on auth context
  const error = isTokenExpired ? 'Token expired' : (!tenantId && !isLoading ? 'No tenant ID available' : null)
  
  return {
    tenantId,
    isLoading,
    error
  }
}