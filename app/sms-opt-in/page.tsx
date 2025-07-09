"use client"

import { useState } from "react"
import { Navbar } from "@/components/shared/Navbar"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { formatPhoneNumber } from "@/lib/utils"

export default function SMSOptInPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    businessName: "",
    agree: false,
  })
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSuccess(true)
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
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Success!</h3>
                <p className="text-gray-600">You've successfully opted in to SMS notifications.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
        </div>
      </div>
      <Footer />
    </div>
  )
}