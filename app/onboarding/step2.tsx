"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Building } from "lucide-react"

export default function OnboardingStep2() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    timezone: "America/New_York",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/onboarding/step3")
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
                  step <= 2 ? "bg-primary text-white" : "bg-gray-300 text-gray-500"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="w-full border-t border-gray-300" />
            <div className="absolute top-0 left-0 w-2/3 border-t-2 border-primary" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Building className="mr-2 h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Business Profile</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Tell us about your business so we can customize your AI receptionist
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <Input
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Acme Hair Salon"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
              >
                <option value="">Select your industry</option>
                <option value="barbershop">Barbershop</option>
                <option value="salon">Hair Salon</option>
                <option value="tattoo">Tattoo Shop</option>
                <option value="spa">Spa & Wellness</option>
                <option value="other">Other Service Business</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6">
            Continue
          </Button>
        </form>

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