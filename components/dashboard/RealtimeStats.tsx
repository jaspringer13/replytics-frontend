"use client"

import { useEffect, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToDailyAnalytics } from '@/lib/supabase-client'

interface RealtimeStatsProps {
  children: ReactNode
  statKey: string
  initialValue: number
}

export function RealtimeStats({ children, statKey, initialValue }: RealtimeStatsProps) {
  const [value, setValue] = useState(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = subscribeToDailyAnalytics((payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        const newData = payload.new
        if (newData[statKey] !== undefined && newData[statKey] !== value) {
          setIsUpdating(true)
          setValue(newData[statKey])
          
          // Reset animation after a short delay
          setTimeout(() => setIsUpdating(false), 1000)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [statKey, value])

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isUpdating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-brand-500/20 rounded-lg animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  )
}

interface RealtimeNumberProps {
  value: number
  format?: (value: number) => string
  className?: string
}

export function RealtimeNumber({ value, format, className = "" }: RealtimeNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  useEffect(() => {
    if (value !== prevValue) {
      // Animate number change
      const duration = 500
      const steps = 20
      const increment = (value - prevValue) / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayValue(value)
          clearInterval(interval)
        } else {
          setDisplayValue(prevValue + (increment * currentStep))
        }
      }, duration / steps)

      setPrevValue(value)

      return () => clearInterval(interval)
    }
  }, [value, prevValue])

  const formattedValue = format ? format(displayValue) : Math.round(displayValue).toString()

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={className}
      >
        {formattedValue}
      </motion.span>
    </AnimatePresence>
  )
}