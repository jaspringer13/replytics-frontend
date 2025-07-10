"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Loader2, Check, ChevronRight, Upload } from 'lucide-react'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessUrl: '',
    businessPhone: '',
    businessAddress: '',
    hasClients: false
  })

  const handleUrlExtraction = async () => {
    if (!businessData.businessUrl) return
    
    setLoading(true)
    // Simulate API call to extract business info
    setTimeout(() => {
      // In production, this would call your API that uses web scraping
      setBusinessData(prev => ({
        ...prev,
        businessName: 'Extracted Business Name',
        businessPhone: '(555) 123-4567',
        businessAddress: '123 Main St, Seattle, WA'
      }))
      setLoading(false)
    }, 2000)
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
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`flex items-center ${i < 4 ? 'flex-1' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  i <= step ? 'bg-brand-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {i < step ? <Check className="w-5 h-5" /> : i}
                </div>
                {i < 4 && (
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
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
                >
                  Continue
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Import Clients */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Import Your Clients (Optional)
            </h2>
            <p className="text-gray-400 mb-8">
              Upload your client list to enable personalized greetings and memory features
            </p>

            <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Supports exports from Square, Jobber, and most CRMs
              </p>
              <button className="px-6 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">
                Select File
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Required columns:</strong> phone_number, full_name
              </p>
              <p className="text-sm text-gray-400">
                <strong>Optional:</strong> last_service, preferred_services, preferred_times
              </p>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600"
              >
                {businessData.hasClients ? 'Continue' : 'Skip for Now'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
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
              onClick={() => window.location.href = '/dashboard'}
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