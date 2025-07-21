"use client"

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Phone, Calendar, Users, Settings, BarChart3, Clock, 
  TrendingUp, PhoneCall, MessageSquare, Home, Menu,
  X, Search, ChevronDown, LogOut, HelpCircle, User,
  CreditCard, ExternalLink, ChevronRight
} from 'lucide-react'
import { useSupabaseAuth as useAuth } from '@/contexts/SupabaseAuthContext'
import { cn } from '@/lib/utils'
import { LiveCallIndicator } from './LiveCallIndicator'
import { ConnectionStatus } from './ConnectionStatus'
import { AIChatWidget } from './AIChatWidget'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const sidebarLinks = [
  { id: 'overview', label: 'Overview', icon: Home, href: '/dashboard' },
  { id: 'calls', label: 'Call History', icon: Phone, href: '/dashboard/calls' },
  { id: 'sms', label: 'SMS Messages', icon: MessageSquare, href: '/dashboard/sms' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
  { id: 'clients', label: 'Clients', icon: Users, href: '/dashboard/clients' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { id: 'billing', label: 'Billing', icon: CreditCard, href: '/dashboard/billing' },
  { id: 'support', label: 'Support', icon: HelpCircle, href: '/dashboard/support' }
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (sidebarOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('.sidebar') && !target.closest('.sidebar-toggle')) {
          setSidebarOpen(false)
        }
      }
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [sidebarOpen])

  const handleSignOut = () => {
    logout()
    router.push('/')
  }

  // Get user initials for avatar
  const userInitials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800/50 backdrop-blur-xl border-b border-gray-700 z-40">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle lg:hidden p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:inline">Replytics</span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search calls, clients, appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* View Site Link */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              View Site
              <ExternalLink className="w-4 h-4" />
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white font-medium">
                  {userInitials}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    {/* User info */}
                    <div className="p-4 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Account Settings
                      </Link>
                      <Link
                        href="/dashboard/support"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Help & Support
                      </Link>
                      <hr className="my-2 border-gray-700" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "sidebar fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700 transition-transform z-30",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <nav className="p-4 space-y-1">
          {sidebarLinks.map(item => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive 
                    ? "bg-brand-500/20 text-brand-400 border-l-4 border-brand-500" 
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            <p>AI Receptionist Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        {/* Breadcrumbs */}
        <div className="px-6 py-3 border-b border-gray-700/50">
          <Breadcrumbs />
        </div>

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Live Call Indicator */}
      <LiveCallIndicator />
      
      {/* Connection Status */}
      <ConnectionStatus />
      <AIChatWidget />
    </div>
  )
}

// Breadcrumb component
function Breadcrumbs() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-2 text-sm">
      {paths.map((path, index) => {
        const href = '/' + paths.slice(0, index + 1).join('/')
        const isLast = index === paths.length - 1
        const label = path.charAt(0).toUpperCase() + path.slice(1)

        return (
          <div key={href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-600" />}
            {isLast ? (
              <span className="text-white font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}