export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function hashPassword(password: string): string {
  // Simple hash for demo purposes - in production use bcrypt or similar
  return btoa(password)
}

export function generateResetToken(): string {
  // Generate a random token for password reset
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  
  const strength = {
    0: { label: 'Very Weak', color: 'text-red-500' },
    1: { label: 'Weak', color: 'text-orange-500' },
    2: { label: 'Fair', color: 'text-yellow-500' },
    3: { label: 'Good', color: 'text-blue-500' },
    4: { label: 'Strong', color: 'text-green-500' },
    5: { label: 'Very Strong', color: 'text-green-600' }
  }
  
  return {
    score,
    ...strength[score as keyof typeof strength] || strength[0]
  }
}