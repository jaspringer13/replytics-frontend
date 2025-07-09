"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface CTASectionProps {
  title: string
  subtitle: string
  primaryButtonText?: string
  primaryButtonHref?: string
  secondaryButtonText?: string
  secondaryButtonHref?: string
  features?: string[]
  variant?: "default" | "gradient" | "dark"
}

export function CTASection({
  title,
  subtitle,
  primaryButtonText = "Get Started Free",
  primaryButtonHref = "/api/auth/signin",
  secondaryButtonText,
  secondaryButtonHref,
  features,
  variant = "gradient"
}: CTASectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const bgClasses = {
    default: "bg-gray-50",
    gradient: "bg-gradient-to-br from-primary via-primary-600 to-primary-800",
    dark: "bg-gray-900"
  }

  const textColorClasses = {
    default: "text-gray-900",
    gradient: "text-white",
    dark: "text-white"
  }

  const subtitleColorClasses = {
    default: "text-gray-600",
    gradient: "text-white/90",
    dark: "text-gray-300"
  }

  return (
    <section 
      ref={sectionRef}
      className={cn(
        "py-24 lg:py-32 relative overflow-hidden",
        bgClasses[variant]
      )}
    >
      {/* Background patterns and effects */}
      {variant === "gradient" && (
        <>
          {/* Mesh pattern overlay */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-10" />
          
          {/* Animated circles */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
          
          {/* Noise texture */}
          <div className="absolute inset-0 noise-overlay" />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated badge */}
          {variant === "gradient" && (
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 transition-all duration-1000",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span className="text-sm font-medium text-white">Limited Time Offer</span>
            </div>
          )}

          {/* Title */}
          <h2
            className={cn(
              "text-5xl lg:text-6xl font-black mb-6 transition-all duration-1000 delay-100",
              textColorClasses[variant],
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            {title}
          </h2>

          {/* Subtitle */}
          <p
            className={cn(
              "text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200",
              subtitleColorClasses[variant],
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            {subtitle}
          </p>

          {/* Features list */}
          {features && features.length > 0 && (
            <div
              className={cn(
                "flex flex-wrap gap-4 justify-center mb-12 transition-all duration-1000 delay-300",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm",
                    variant === "gradient" 
                      ? "bg-white/10 border border-white/20 text-white" 
                      : "bg-white border border-gray-200 text-gray-700"
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div
            className={cn(
              "flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-400",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Link href={primaryButtonHref}>
              <Button 
                size="lg" 
                className={cn(
                  "group h-14 px-8 text-lg font-semibold transition-all hover:scale-[1.02] hover:shadow-2xl",
                  variant === "gradient" 
                    ? "bg-white text-primary hover:bg-gray-50" 
                    : "bg-primary text-white hover:bg-primary-600"
                )}
              >
                <span className="mr-2">{primaryButtonText}</span>
                <ArrowRight className="w-5 h-5 inline-block transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            {secondaryButtonText && secondaryButtonHref && (
              <Link href={secondaryButtonHref}>
                <Button 
                  size="lg" 
                  variant="outline"
                  className={cn(
                    "h-14 px-8 text-lg font-semibold transition-all hover:scale-[1.02]",
                    variant === "gradient"
                      ? "border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                      : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                  )}
                >
                  {secondaryButtonText}
                </Button>
              </Link>
            )}
          </div>

          {/* Trust text */}
          <p
            className={cn(
              "mt-8 text-sm transition-all duration-1000 delay-500",
              variant === "gradient" ? "text-white/70" : "text-gray-500",
              isVisible ? "opacity-100" : "opacity-0"
            )}
          >
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>

      {/* Decorative bottom wave */}
      {variant === "gradient" && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </section>
  )
}