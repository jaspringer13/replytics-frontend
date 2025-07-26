"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: 49,
    yearlyPrice: 490,
    features: [
      "24/7 AI receptionist",
      "Single Google Calendar sync",
      "Automated appointment booking",
      "SMS reminders",
      "Call transcription",
      "Basic dashboard",
      "Email support (24hr SLA)",
    ],
  },
  {
    name: "Professional",
    price: 99,
    yearlyPrice: 990,
    highlighted: true,
    features: [
      "Everything in Starter, plus:",
      "Up to 3 Google calendars",
      "Multi-calendar conflict avoidance",
      "Bulk reschedule feature",
      "Advanced dashboard metrics",
      "Priority email support",
      "Shared SMS reminders",
    ],
  },
  {
    name: "Enterprise",
    price: 199,
    yearlyPrice: 1990,
    features: [
      "Everything in Professional, plus:",
      "GapHunter auto-scheduling",
      "Unlimited calendars & users",
      "Usage-based analytics",
      "Custom business hours",
      "Performance SLAs",
      "SMS overage included",
    ],
  },
]

export function PricingTable() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center space-x-4">
        <span className={!isYearly ? "font-semibold" : "text-gray-500"}>Monthly</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              isYearly ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={isYearly ? "font-semibold" : "text-gray-500"}>
          Yearly <span className="text-primary text-sm">(Save 2 months)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg p-6 ${
              plan.highlighted ? "border-2 border-primary shadow-lg scale-105" : "border border-gray-200"
            }`}
          >
            {plan.highlighted && (
              <div className="text-center mb-4">
                <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">Most Popular</span>
              </div>
            )}
            <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">
                {formatCurrency(isYearly ? plan.yearlyPrice : plan.price)}
              </span>
              <span className="text-gray-500">/{isYearly ? "year" : "month"}</span>
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/api/auth/signin" className="w-full">
              <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                Get Started
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}