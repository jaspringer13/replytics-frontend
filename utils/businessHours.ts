/**
 * Business hours utility functions
 */

export function isWithinBusinessHours(timezone?: string): boolean {
  const now = new Date()
  const businessTime = timezone 
    ? new Date(now.toLocaleString("en-US", { timeZone: timezone }))
    : now
  
  const hour = businessTime.getHours()
  const isBusinessHours = hour >= 9 && hour < 17
  const isWeekday = businessTime.getDay() >= 1 && businessTime.getDay() <= 5
  
  return isBusinessHours && isWeekday
}

export function getBusinessTime(timezone?: string): Date {
  const now = new Date()
  return timezone 
    ? new Date(now.toLocaleString("en-US", { timeZone: timezone }))
    : now
}