"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { PlayCircle } from "lucide-react"

export function HeroSection() {
  const [isDemoOpen, setIsDemoOpen] = useState(false)

  return (
    <section className="relative pt-32 pb-20 px-4 gradient-hero text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Your AI Receptionist Never Takes a Day Off
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in">
            Let Replytics answer calls, book appointments, and grow your business 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link href="/api/auth/signin">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white hover:text-primary"
              onClick={() => setIsDemoOpen(true)}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Hear a Demo
            </Button>
          </div>
          <p className="mt-8 text-sm opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>

      {isDemoOpen && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              Hear Replytics in Action
            </h3>
            <audio controls className="w-full mb-4">
              <source src="/demo-call.mp3" type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <Button
              variant="outline"
              onClick={() => setIsDemoOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </dialog>
      )}
    </section>
  )
}