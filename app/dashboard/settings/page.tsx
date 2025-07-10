"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  Building, Mic, Clock, Users, Link2, Save, 
  Volume2, Globe, Calendar, Shield, Bell, Zap,
  Brain, MessageSquare, Phone, Mail, MapPin,
  ChevronRight, Check, X, Info
} from 'lucide-react'

type TabType = 'business' | 'ai' | 'team' | 'integrations'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('business')
  const [saved, setSaved] = useState(false)
  
  // Form states
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Elite Barbershop',
    phone: '+1 (555) 123-4567',
    email: 'contact@elitebarbershop.com',
    address: '123 Main St, New York, NY 10001',
    website: 'www.elitebarbershop.com',
    timezone: 'America/New_York'
  })

  const [aiSettings, setAiSettings] = useState({
    greeting: 'Thank you for calling Elite Barbershop. How can I help you today?',
    voice: 'professional',
    language: 'en-US',
    responseTime: 'normal',
    enableAppointments: true,
    enableQuestions: true,
    enableVoicemail: true,
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '20:00', closed: false },
      saturday: { open: '10:00', close: '17:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    }
  })

  // Check for tab in URL params
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && ['business', 'ai', 'team', 'integrations'].includes(urlTab)) {
      setActiveTab(urlTab as TabType)
    }
  }, [searchParams])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building },
    { id: 'ai', label: 'AI Configuration', icon: Brain },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Link2 }
  ]

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your business settings and AI configuration</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex gap-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-brand-500 text-white' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Business Info Tab */}
        {activeTab === 'business' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  value={businessInfo.timezone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-all"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        )}

        {/* AI Configuration Tab */}
        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Voice Settings */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Voice Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Voice Type
                  </label>
                  <select
                    value={aiSettings.voice}
                    onChange={(e) => setAiSettings({ ...aiSettings, voice: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={aiSettings.language}
                    onChange={(e) => setAiSettings({ ...aiSettings, language: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Greeting Message
                  </label>
                  <textarea
                    value={aiSettings.greeting}
                    onChange={(e) => setAiSettings({ ...aiSettings, greeting: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
                    placeholder="How should your AI answer the phone?"
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </h3>
              
              <div className="space-y-3">
                {Object.entries(aiSettings.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-gray-300 capitalize">{day}</span>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => setAiSettings({
                          ...aiSettings,
                          businessHours: {
                            ...aiSettings.businessHours,
                            [day]: { ...hours, closed: !e.target.checked }
                          }
                        })}
                        className="rounded border-gray-600 bg-gray-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-400">Open</span>
                    </label>

                    {!hours.closed && (
                      <>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setAiSettings({
                            ...aiSettings,
                            businessHours: {
                              ...aiSettings.businessHours,
                              [day]: { ...hours, open: e.target.value }
                            }
                          })}
                          className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setAiSettings({
                            ...aiSettings,
                            businessHours: {
                              ...aiSettings.businessHours,
                              [day]: { ...hours, close: e.target.value }
                            }
                          })}
                          className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Features */}
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI Features
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={aiSettings.enableAppointments}
                    onChange={(e) => setAiSettings({ ...aiSettings, enableAppointments: e.target.checked })}
                    className="mt-1 rounded border-gray-600 bg-gray-700 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-white font-medium">Appointment Booking</p>
                    <p className="text-sm text-gray-400">Allow AI to schedule appointments</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={aiSettings.enableQuestions}
                    onChange={(e) => setAiSettings({ ...aiSettings, enableQuestions: e.target.checked })}
                    className="mt-1 rounded border-gray-600 bg-gray-700 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-white font-medium">Answer Questions</p>
                    <p className="text-sm text-gray-400">Let AI answer common business questions</p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={aiSettings.enableVoicemail}
                    onChange={(e) => setAiSettings({ ...aiSettings, enableVoicemail: e.target.checked })}
                    className="mt-1 rounded border-gray-600 bg-gray-700 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-white font-medium">Take Voicemail</p>
                    <p className="text-sm text-gray-400">Record messages when unavailable</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-all"
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save AI Settings'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Team Members Tab */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Team Members</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-all">
                <Users className="w-4 h-4" />
                Add Member
              </button>
            </div>

            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Team Management Coming Soon</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Soon you'll be able to add team members, assign roles, and manage permissions for your AI receptionist.
              </p>
            </div>
          </motion.div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Integrations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Google Calendar</h3>
                      <p className="text-sm text-gray-400">Sync appointments</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">Coming Soon</span>
                </div>
              </div>

              <div className="p-6 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">SMS Integration</h3>
                      <p className="text-sm text-gray-400">Send confirmations</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">Coming Soon</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Save notification */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Settings saved successfully!
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}