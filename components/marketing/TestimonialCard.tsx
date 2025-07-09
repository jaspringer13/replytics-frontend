"use client"

import { Quote, Star } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface TestimonialCardProps {
  name: string
  role: string
  content: string
  avatar?: string
  rating?: number
  delay?: number
}

export function TestimonialCard({ 
  name, 
  role, 
  content, 
  avatar,
  rating = 5,
  delay = 0 
}: TestimonialCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

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

  // Generate avatar initials if no avatar provided
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      ref={cardRef}
      className={cn(
        "group h-full transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Glassmorphism card */}
      <div className="relative h-full p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* Gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quote icon */}
        <div className="relative mb-6">
          <Quote className="h-10 w-10 text-primary/20 absolute -top-2 -left-2" />
        </div>
        
        {/* Rating stars */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "h-4 w-4 transition-colors duration-300",
                i < rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>
        
        {/* Testimonial content */}
        <blockquote className="relative">
          <p className="text-lg italic leading-relaxed text-gray-700 mb-6">
            "{content}"
          </p>
        </blockquote>
        
        {/* Author info */}
        <div className="flex items-center gap-4 mt-auto">
          {/* Avatar */}
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/50">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white" />
          </div>
          
          {/* Name and role */}
          <div>
            <p className="text-base font-semibold text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  )
}

// New component for testimonials section with proper background
export function TestimonialsSection() {
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

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Owner, Bliss Hair Studio",
      content: "Replytics has transformed my business. I used to spend hours on the phone, now I can focus on my clients while never missing a booking.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Tattoo Artist, Ink Masters",
      content: "The AI sounds so natural, my clients don't even realize they're not talking to a real person. It's incredible!",
      rating: 5
    },
    {
      name: "Jessica Williams",
      role: "Spa Manager, Tranquil Waters",
      content: "We've seen a 40% reduction in no-shows since implementing SMS reminders. The ROI has been fantastic.",
      rating: 5
    },
  ]

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Gradient background for glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50" />
      <div className="absolute inset-0 bg-gradient-mesh opacity-[0.03]" />
      
      {/* Floating orbs for depth */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-16">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm mb-6 transition-all duration-1000",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-gray-700">5-Star Reviews</span>
          </div>
          
          <h2
            className={cn(
              "text-5xl lg:text-6xl font-black text-gray-900 mb-6 transition-all duration-1000 delay-100",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Loved by
            <span className="text-gradient"> Service Businesses</span>
          </h2>
          
          <p
            className={cn(
              "text-xl text-gray-600 max-w-3xl mx-auto transition-all duration-1000 delay-200",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Join thousands of businesses that trust Replytics to handle their customer communications with excellence.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index} 
              {...testimonial} 
              delay={index * 150}
            />
          ))}
        </div>
      </div>
    </section>
  )
}