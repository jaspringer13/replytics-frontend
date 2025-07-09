"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { PlayCircle, Phone, Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function HeroSection() {
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10" />
      
      {/* Floating accent elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-12 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 noise-overlay" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated badge */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 transition-all duration-1000",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">Trusted by 10,000+ businesses</span>
          </div>

          {/* Main headline */}
          <h1
            className={cn(
              "text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-gray-900 mb-8 transition-all duration-1000 delay-100",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Your AI Receptionist
            <span className="block text-gradient mt-2">Never Takes a Day Off</span>
          </h1>

          {/* Subheadline */}
          <p
            className={cn(
              "text-2xl md:text-3xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Let Replytics answer calls, book appointments, and grow your business 24/7 with human-like conversations
          </p>

          {/* CTA buttons */}
          <div
            className={cn(
              "flex flex-col sm:flex-row gap-6 justify-center mb-8 transition-all duration-1000 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Link href="/api/auth/signin">
              <Button 
                size="lg" 
                className="group h-16 px-10 text-lg bg-primary text-white hover:bg-primary-600 hover:scale-[1.02] hover:shadow-glow transition-all duration-200"
              >
                <span className="mr-2">Get Started Free</span>
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="group h-16 px-10 text-lg border-gray-300 text-gray-900 hover:border-primary hover:text-primary hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              onClick={() => setIsDemoOpen(true)}
            >
              <PlayCircle className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Hear a Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <p
            className={cn(
              "text-sm text-gray-500 mb-16 transition-all duration-1000 delay-400",
              isVisible ? "opacity-100" : "opacity-0"
            )}
          >
            No credit card required • 14-day free trial • Cancel anytime
          </p>

          {/* Feature pills */}
          <div
            className={cn(
              "flex flex-wrap gap-4 justify-center transition-all duration-1000 delay-500",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700">Unlimited Calls</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700">Smart Scheduling</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
              <span className="text-sm font-medium text-gray-700">99.9% Uptime</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator" />
      </div>

      {/* Demo Modal */}
      {isDemoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all animate-scale-in">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Hear Replytics in Action
            </h3>
            <p className="text-gray-600 mb-6">
              Listen to a real conversation between Replytics and a customer
            </p>
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <audio controls className="w-full">
                <source src="/demo-call.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsDemoOpen(false)}
                className="flex-1 h-12"
              >
                Close
              </Button>
              <Link href="/api/auth/signin" className="flex-1">
                <Button className="w-full h-12 bg-primary hover:bg-primary-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}