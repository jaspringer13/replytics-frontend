"use client"

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Users, MapPin, Phone, Plus
} from 'lucide-react'

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

// Demo appointments data
const demoAppointments = [
  { id: 1, date: new Date(2025, 0, 15, 10, 0), client: 'Sarah Johnson', service: 'Hair Cut & Style', duration: 60 },
  { id: 2, date: new Date(2025, 0, 15, 14, 30), client: 'Mike Chen', service: 'Beard Trim', duration: 30 },
  { id: 3, date: new Date(2025, 0, 16, 9, 0), client: 'Emma Rodriguez', service: 'Color Treatment', duration: 120 },
  { id: 4, date: new Date(2025, 0, 17, 11, 0), client: 'David Kim', service: 'Haircut', duration: 45 },
  { id: 5, date: new Date(2025, 0, 17, 15, 0), client: 'Lisa Wang', service: 'Styling', duration: 45 },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  const getAppointmentsForDate = (date: Date) => {
    return demoAppointments.filter(apt => 
      apt.date.getDate() === date.getDate() &&
      apt.date.getMonth() === date.getMonth() &&
      apt.date.getFullYear() === date.getFullYear()
    )
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
      const appointments = getAppointmentsForDate(date)
      
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
            {appointments.length > 0 && (
              <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                {appointments.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {appointments.slice(0, 2).map((apt, idx) => (
              <div key={idx} className="text-xs text-gray-400 truncate">
                {apt.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {apt.client}
              </div>
            ))}
            {appointments.length > 2 && (
              <div className="text-xs text-gray-500">+{appointments.length - 2} more</div>
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
                  {getAppointmentsForDate(selectedDate).length > 0 ? (
                    getAppointmentsForDate(selectedDate).map(apt => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-white">{apt.client}</h4>
                          <span className="text-xs text-gray-400">
                            {apt.duration} min
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{apt.service}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {apt.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            Call
                          </span>
                        </div>
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