"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { CheckCircle } from "lucide-react"

export default function OnboardingStep3() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white"
              >
                {step}
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="w-full border-t-2 border-primary" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            <h2 className="text-2xl font-bold">You're All Set!</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Your AI receptionist is ready to start answering calls
          </p>

          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
            <p className="text-gray-500">Tutorial video placeholder</p>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Watch this quick tutorial to learn how to get the most out of Replytics.
          </p>

          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}