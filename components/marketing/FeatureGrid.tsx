"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Phone, Calendar, MessageSquare, Zap, BarChart3, Shield, Globe, Clock } from "lucide-react"

const features = [
  {
    icon: Phone,
    title: "24/7 Call Answering",
    description: "Never miss another call. Your AI receptionist works round the clock, handling multiple calls simultaneously.",
    gradient: "from-brand-400 to-brand-600"
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Books appointments directly into your calendar, checking availability and sending confirmations automatically.",
    gradient: "from-blue-400 to-blue-600"
  },
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description: "AI-powered voice that sounds so human, your customers won't know they're talking to AI.",
    gradient: "from-purple-400 to-purple-600"
  },
  {
    icon: Zap,
    title: "Instant Responses",
    description: "No hold times, no busy signals. Every caller gets immediate, professional attention.",
    gradient: "from-orange-400 to-orange-600"
  },
  {
    icon: BarChart3,
    title: "Call Analytics",
    description: "Track every interaction with detailed analytics, transcripts, and insights to improve your business.",
    gradient: "from-green-400 to-green-600"
  },
  {
    icon: Shield,
    title: "HIPAA Compliant",
    description: "Bank-level security and full HIPAA compliance for healthcare providers and sensitive industries.",
    gradient: "from-red-400 to-red-600"
  }
]

export function FeatureGrid() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features that transform how you handle customer calls
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="relative h-full p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 overflow-hidden">
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-6">
            Plus enterprise features like API access, custom integrations, and white-label options
          </p>
          <a href="#" className="inline-flex items-center text-brand-600 hover:text-brand-700 font-semibold">
            See all features
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}