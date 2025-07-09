"use client"

import { Phone, Calendar, MessageSquare, Mic, Clock, BarChart3, Shield, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Phone,
    title: "24/7 Availability",
    description: "Never miss a call again. Your AI receptionist works around the clock, handling inquiries with professionalism.",
    color: "from-primary to-cyan-500",
    iconBg: "bg-primary-50",
    iconColor: "text-primary-600"
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automatically books appointments based on your availability, syncing with your calendar in real-time.",
    color: "from-blue-500 to-indigo-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    icon: MessageSquare,
    title: "SMS Reminders",
    description: "Reduce no-shows with automated text reminders and confirmations sent to your customers.",
    color: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  {
    icon: Mic,
    title: "Natural Voice",
    description: "Sounds just like a real receptionist with natural conversation flow and human-like responses.",
    color: "from-green-500 to-emerald-500",
    iconBg: "bg-green-50",
    iconColor: "text-green-600"
  },
  {
    icon: Clock,
    title: "Instant Response",
    description: "Zero wait times. Your AI receptionist answers immediately, providing instant assistance to callers.",
    color: "from-orange-500 to-red-500",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600"
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track call metrics, customer insights, and performance data with comprehensive analytics.",
    color: "from-teal-500 to-cyan-500",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and HIPAA compliance ensure your customer data stays protected.",
    color: "from-gray-600 to-gray-800",
    iconBg: "bg-gray-50",
    iconColor: "text-gray-600"
  },
  {
    icon: Zap,
    title: "Lightning Fast Setup",
    description: "Get started in minutes with our intuitive onboarding process and pre-built templates.",
    color: "from-yellow-500 to-orange-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600"
  }
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const Icon = feature.icon

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer",
        isVisible ? "animate-fade-up opacity-100" : "opacity-0"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r rounded-2xl opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300",
        feature.color
      )} />
      
      {/* Gradient border effect */}
      <div className={cn(
        "absolute -inset-[1px] bg-gradient-to-r rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10",
        feature.color
      )} />
      
      <div className="relative">
        {/* Icon container */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300",
          feature.iconBg
        )}>
          <Icon className={cn("w-6 h-6", feature.iconColor)} />
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
          {feature.title}
        </h3>
        
        {/* Description */}
        <p className="text-base text-gray-600 leading-relaxed">
          {feature.description}
        </p>
        
        {/* Learn more link (appears on hover) */}
        <div className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", feature.color)}>
            Learn more
          </span>
          <span className={cn("ml-1 transition-transform group-hover:translate-x-1", feature.iconColor)}>
            →
          </span>
        </div>
      </div>
    </div>
  )
}

export function FeatureGrid() {
  const [headerVisible, setHeaderVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (headerRef.current) {
      observer.observe(headerRef.current)
    }

    return () => {
      if (headerRef.current) {
        observer.unobserve(headerRef.current)
      }
    }
  }, [])

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-[0.02]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-16">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 transition-all duration-1000",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powerful Features</span>
          </div>
          
          <h2
            className={cn(
              "text-5xl lg:text-6xl font-black text-gray-900 mb-6 transition-all duration-1000 delay-100",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Everything You Need to
            <span className="block text-gradient mt-2">Automate Your Reception</span>
          </h2>
          
          <p
            className={cn(
              "text-xl text-gray-600 max-w-3xl mx-auto transition-all duration-1000 delay-200",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Our AI receptionist comes packed with features designed to streamline your business communications and enhance customer experience.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}