import { useSession } from 'next-auth/react'

export function useUserTenant() {
  const { data: session, status } = useSession()
  
  const tenantId = session?.user?.tenantId || ''
  const isLoading = status === 'loading'
  
  // Determine error state
  const error = !tenantId && !isLoading ? 'No tenant ID available' : null
  
  return {
    tenantId,
    isLoading,
    error
  }
}