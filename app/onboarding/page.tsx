"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Calendar } from "lucide-react"
import { connectGoogleCalendar } from "@/lib/calendar"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await connectGoogleCalendar("dummy-token")
      router.push("/onboarding/step2")
    } catch (error) {
      console.error("Error connecting calendar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step === 1 ? "bg-primary text-white" : "bg-gray-300 text-gray-500"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="w-full border-t border-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Calendar className="mr-2 h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Connect Your Calendar</h2>
          </div>
          <p className="text-gray-600 mb-6">
            We'll sync with your Google Calendar to manage appointments
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Click the button below to authorize Replytics to access your Google Calendar. We'll only
            read and write appointment data.
          </p>
          <Button onClick={handleConnect} disabled={isLoading} className="w-full">
            {isLoading ? "Connecting..." : "Connect Google Calendar"}
          </Button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}