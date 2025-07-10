"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, Loader2, Check, ChevronRight, Upload, Phone, Clock, Mic, Building } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, onboardingStep, updateOnboardingStep } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessUrl: '',
    businessPhone: '',
    businessAddress: '',
    businessType: '',
    hasClients: false,
    // Business hours
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '14:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true },
    },
    // AI settings
    voiceId: 'professional-female',
    greeting: '',
  })
  
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    
    // Resume from saved step
    if (onboardingStep > 0 && onboardingStep < 5) {
      setStep(onboardingStep)
    }
  }, [user, onboardingStep, router])

  const handleUrlExtraction = async () => {
    if (!businessData.businessUrl) return
    
    setLoading(true)
    try {
      // Call backend to extract business info
      const response = await apiClient.request('/api/dashboard/business/extract', {
        method: 'POST',
        body: JSON.stringify({ url: businessData.businessUrl })
      })
      
      setBusinessData(prev => ({
        ...prev,
        businessName: response.name || '',
        businessPhone: response.phone || '',
        businessAddress: response.address || ''
      }))
      
      // Move to next step
      await handleStepComplete(1)
      setStep(2)
    } catch (error) {
      console.error('Failed to extract business info:', error)
      // Continue to manual entry
      setStep(2)
    } finally {
      setLoading(false)
    }
  }
  
  const handleStepComplete = async (currentStep: number) => {
    try {
      // Update onboarding progress
      await updateOnboardingStep(currentStep + 1)
      
      // Save data to backend based on step
      switch (currentStep) {
        case 2:
          // Save business info
          await apiClient.request('/api/dashboard/business', {
            method: 'PUT',
            body: JSON.stringify({
              name: businessData.businessName,
              phone: businessData.businessPhone,
              address: businessData.businessAddress,
              website: businessData.businessUrl,
              type: businessData.businessType,
            })
          })
          break
        case 3:
          // Save business hours
          await apiClient.request('/api/dashboard/business/hours', {
            method: 'PUT',
            body: JSON.stringify(businessData.businessHours)
          })
          break
        case 4:
          // Save AI settings
          await apiClient.request('/api/dashboard/business/ai-settings', {
            method: 'PUT',
            body: JSON.stringify({
              voice_id: businessData.voiceId,
              greeting: businessData.greeting,
            })
          })
          break
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`flex items-center ${i < 4 ? 'flex-1' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  i <= step ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-5 h-5" /> : i}
                </div>
                {i < 5 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    i < step ? 'bg-brand-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Quick Start */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Let's Get You Started! 🚀
            </h2>
            <p className="text-gray-400 mb-8">
              Enter your website URL and we'll automatically extract your business information
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    placeholder="https://yourbusiness.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-brand-500 focus:outline-none"
                    value={businessData.businessUrl}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, businessUrl: e.target.value }))}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUrlExtraction}
                disabled={loading || !businessData.businessUrl}
                className="w-full py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting Business Info...
                  </>
                ) : (
                  <>
                    Extract Business Info
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800/50 text-gray-400">Or enter manually</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
              >
                Enter Details Manually
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              Business Information
            </h2>

            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, businessName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                    value={businessData.businessPhone}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, businessPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true)
                    await handleStepComplete(2)
                    setStep(3)
                    setLoading(false)
                  }}
                  disabled={loading}
                  className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Business Hours */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Set Your Business Hours
            </h2>
            <p className="text-gray-400 mb-8">
              Let your AI receptionist know when you're open
            </p>

            <div className="space-y-4">
              {Object.entries(businessData.businessHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <span className="text-white font-medium capitalize">{day}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => setBusinessData(prev => ({
                          ...prev,
                          businessHours: {
                            ...prev.businessHours,
                            [day]: { ...hours, closed: !e.target.checked }
                          }
                        }))}
                        className="rounded text-brand-500"
                      />
                      <span className="text-gray-300">Open</span>
                    </label>
                    {!hours.closed && (
                      <>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setBusinessData(prev => ({
                            ...prev,
                            businessHours: {
                              ...prev.businessHours,
                              [day]: { ...hours, open: e.target.value }
                            }
                          }))}
                          className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded text-white"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setBusinessData(prev => ({
                            ...prev,
                            businessHours: {
                              ...prev.businessHours,
                              [day]: { ...hours, close: e.target.value }
                            }
                          }))}
                          className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded text-white"
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  setLoading(true)
                  await handleStepComplete(3)
                  setStep(4)
                  setLoading(false)
                }}
                disabled={loading}
                className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: AI Voice Settings */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Choose Your AI Voice
            </h2>
            <p className="text-gray-400 mb-8">
              Select a voice for your AI receptionist
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { id: 'professional-female', name: 'Sarah', desc: 'Professional female' },
                { id: 'professional-male', name: 'James', desc: 'Professional male' },
                { id: 'friendly-female', name: 'Emma', desc: 'Friendly female' },
                { id: 'friendly-male', name: 'Alex', desc: 'Friendly male' },
              ].map(voice => (
                <button
                  key={voice.id}
                  onClick={() => setBusinessData(prev => ({ ...prev, voiceId: voice.id }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    businessData.voiceId === voice.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Mic className="w-8 h-8 text-brand-400 mx-auto mb-2" />
                  <h3 className="text-white font-medium">{voice.name}</h3>
                  <p className="text-sm text-gray-400">{voice.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Greeting (optional)
              </label>
              <textarea
                value={businessData.greeting}
                onChange={(e) => setBusinessData(prev => ({ ...prev, greeting: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                rows={3}
                placeholder="Thank you for calling [Business Name], how can I help you today?"
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  setLoading(true)
                  await handleStepComplete(4)
                  setStep(5)
                  setLoading(false)
                }}
                disabled={loading}
                className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-brand-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              You're All Set! 🎉
            </h2>
            <p className="text-gray-400 mb-8">
              Your AI receptionist is ready to start taking calls and booking appointments
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}