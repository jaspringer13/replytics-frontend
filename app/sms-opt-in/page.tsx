"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { formatPhoneNumber } from "@/lib/utils"
import { CheckCircle } from "lucide-react"

interface ConsentRecord {
  id: string;
  fullName: string;
  phoneNumber: string;
  businessName: string;
  consentGiven: boolean;
  timestamp: string;
  consentMethod: string;
  consentPageUrl: string;
  consentText: string;
  consentVersion: string;
}

export default function SMSOptInPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    businessName: "",
    agree: false,
  })
  const [isSuccess, setIsSuccess] = useState(false)
  const [consentId, setConsentId] = useState<string>("");
  const [consentTimestamp, setConsentTimestamp] = useState<string>("");
  const [storedConsents, setStoredConsents] = useState<ConsentRecord[]>([])

  useEffect(() => {
    // Load existing consent records from localStorage
    const existingRecords = JSON.parse(localStorage.getItem('sms-consent-records') || '[]')
    setStoredConsents(existingRecords)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create consent record
    const consentRecord: ConsentRecord = {
      id: Date.now().toString(),
      fullName: formData.name,
      phoneNumber: formData.phone,
      businessName: formData.businessName,
      consentGiven: true,
      timestamp: new Date().toISOString(),
      consentMethod: 'web-form',
      consentPageUrl: 'https://replytics.ai/sms-opt-in',
      consentText: 'I agree to receive SMS messages from businesses using Replytics. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe at any time.',
      consentVersion: 'v1.0'
    }
    
    try {
      // Try to send to backend API first
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/sms/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(consentRecord)
        })
        
        if (!response.ok) throw new Error('Failed to record consent in backend')
        console.log('Consent recorded in backend:', consentRecord)
      }
    } catch (error) {
      console.error('Failed to record consent in backend:', error)
      // Fall back to localStorage
    }
    
    // Always store in localStorage as backup
    const existingRecords = JSON.parse(localStorage.getItem('sms-consent-records') || '[]')
    existingRecords.push(consentRecord)
    localStorage.setItem('sms-consent-records', JSON.stringify(existingRecords))
    setStoredConsents(existingRecords)
    
    // Log to console for verification
    console.log('SMS Consent Recorded:', consentRecord)
    
    // Set consent details for display
    setConsentId(consentRecord.id)
    setConsentTimestamp(consentRecord.timestamp)
    
    // Show success message
    setIsSuccess(true)
    
    // Reset form after 5 seconds
    setTimeout(() => {
      setFormData({ name: '', phone: '', businessName: '', agree: false })
      setIsSuccess(false)
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-2">SMS Notifications Opt-In</h1>
            <p className="text-gray-600 mb-6">
              Subscribe to receive appointment reminders and updates via SMS
            </p>

            {isSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Successfully Subscribed!
                </h3>
                <p className="text-gray-700 text-center mb-4">
                  You've successfully opted in to SMS notifications for {formData.phone}
                </p>
                <div className="bg-white rounded-lg p-4 text-sm border border-gray-200">
                  <p className="text-gray-600 mb-2 font-medium">What happens next:</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>• You'll receive a confirmation SMS shortly</li>
                    <li>• Appointment reminders will be sent to this number</li>
                    <li>• Reply STOP at any time to unsubscribe</li>
                    <li>• Text HELP for support</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Consent ID: {consentId} | Recorded: {new Date(consentTimestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="consent_version" value="v1.0" />
                <input type="hidden" name="consent_timestamp" value={new Date().toISOString()} />
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Business Name (Optional)</label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={formData.agree}
                    onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                    className="mt-1"
                  />
                  <label htmlFor="agree" className="text-sm leading-relaxed">
                    I agree to receive SMS messages from businesses using Replytics. Message frequency
                    varies. Message and data rates may apply. Reply STOP to unsubscribe at any time.
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={!formData.agree}>
                  Subscribe to SMS Updates
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  You can opt out at any time by texting STOP to any message.
                </p>
              </form>
            )}
          </div>
          
          {/* Consent Records Display (Development Only) */}
          {process.env.NODE_ENV === 'development' && storedConsents.length > 0 && (
            <div className="mt-8 p-6 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Consent Records (Dev Only)
              </h3>
              <div className="space-y-2">
                <p className="text-xs text-gray-600">Total Records: {storedConsents.length}</p>
                <details className="cursor-pointer">
                  <summary className="text-xs text-gray-600 hover:text-gray-800">
                    Click to view all consent records
                  </summary>
                  <pre className="mt-2 p-3 bg-white rounded border border-gray-200 text-xs text-gray-700 overflow-auto max-h-64">
                    {JSON.stringify(storedConsents, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}