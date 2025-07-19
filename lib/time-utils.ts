/**
 * Time formatting utilities for consistent time display across the application
 */

/**
 * Format a timestamp as relative time (e.g., "5m", "2:30 PM", "Mon", "Jan 15")
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60)
    return `${diffInMinutes}m`
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

/**
 * Format a duration in seconds to human-readable format (e.g., "2m 30s", "1h 15m")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const remainingMinutes = Math.floor((seconds % 3600) / 60)
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
}

/**
 * Check if a timestamp is within the last N hours
 */
export function isWithinHours(timestamp: string, hours: number): boolean {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  return diffInHours <= hours
}

/**
 * Check if a timestamp is today
 */
export function isToday(timestamp: string): boolean {
  const date = new Date(timestamp)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}