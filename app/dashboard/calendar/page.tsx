"use client"

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Users, MapPin, Phone, Plus, AlertCircle, Loader2
} from 'lucide-react'
import { useBookings } from '@/hooks/useBackendData'
import { Booking } from '@/lib/api-client'

// Helper to get days in month
function getDaysInMonth(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  return { daysInMonth, startingDayOfWeek }
}

// Helper to format date for API
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to parse booking date and time
const parseBookingDateTime = (booking: Booking): Date => {
  const [year, month, day] = booking.date.split('-').map(Number)
  const [hours, minutes] = booking.time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateString, setSelectedDateString] = useState<string | undefined>()
  
  const { data: bookings, loading, error, refetch } = useBookings(selectedDateString)
  
  // Update selected date string when date changes
  useEffect(() => {
    if (selectedDate) {
      setSelectedDateString(formatDateForAPI(selectedDate))
    }
  }, [selectedDate])

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const getBookingsForDate = (date: Date) => {
    if (!bookings) return []
    const dateString = formatDateForAPI(date)
    return bookings.filter(booking => booking.date === dateString)
  }
  
  const getAllBookingsForMonth = () => {
    if (!bookings) return {}
    const bookingsByDate: { [key: string]: Booking[] } = {}
    
    // This would ideally fetch all bookings for the month
    // For now, we'll work with what we have
    bookings.forEach(booking => {
      if (!bookingsByDate[booking.date]) {
        bookingsByDate[booking.date] = []
      }
      bookingsByDate[booking.date].push(booking)
    })
    
    return bookingsByDate
  }

  const renderCalendarDays = () => {
    const days = []
    const today = new Date()
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-800/20"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()
      const dateString = formatDateForAPI(date)
      const monthBookings = getAllBookingsForMonth()
      const dayBookings = monthBookings[dateString] || []
      
      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.02 }}
          onClick={() => setSelectedDate(date)}
          className={`h-32 p-2 border border-gray-700/50 cursor-pointer transition-all ${
            isToday ? 'bg-brand-500/10 border-brand-500/50' : 'bg-gray-800/30 hover:bg-gray-800/50'
          } ${isSelected ? 'ring-2 ring-brand-500' : ''}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-brand-400' : 'text-gray-300'}`}>
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                {dayBookings.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayBookings.slice(0, 2).map((booking, idx) => (
              <div key={idx} className="text-xs text-gray-400 truncate">
                {booking.time} - {booking.customerName}
              </div>
            ))}
            {dayBookings.length > 2 && (
              <div className="text-xs text-gray-500">+{dayBookings.length - 2} more</div>
            )}
          </div>
        </motion.div>
      )
    }
    
    return days
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">Calendar</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* View switcher */}
            <div className="flex gap-2">
              {(['month', 'week', 'day'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    view === v 
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Month navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
                {monthYear}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Today button */}
            <button
              onClick={goToToday}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {view === 'month' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-px mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-px">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>

            {/* Selected day details */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedDate 
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a date'
                }
              </h3>
              
              {selectedDate ? (
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="text-gray-400">Failed to load bookings</p>
                      <button 
                        onClick={() => refetch()}
                        className="mt-4 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  ) : bookings && bookings.length > 0 ? (
                    bookings.map(booking => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white">{booking.customerName}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : booking.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{booking.service}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.phoneNumber}
                          </span>
                        </div>
                        {booking.notes && (
                          <p className="mt-2 text-xs text-gray-500 italic">{booking.notes}</p>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No appointments scheduled</p>
                      <button className="mt-4 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                        Add appointment
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Select a date to view appointments</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Week and Day views - Coming soon */}
        {view !== 'month' && (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {view.charAt(0).toUpperCase() + view.slice(1)} View Coming Soon
            </h2>
            <p className="text-gray-400">
              We're working on adding week and day views for better appointment management
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}