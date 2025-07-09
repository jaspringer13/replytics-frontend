"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { PlayCircle } from "lucide-react"

export function HeroSection() {
  const [isDemoOpen, setIsDemoOpen] = useState(false)

  return (
    <section className="gradient-hero text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 text-white">
            Your AI Receptionist Never Takes a Day Off
          </h1>
          <p className="text-xl lg:text-2xl mb-10 text-white/90">
            Let Replytics answer calls, book appointments, and grow your business 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/auth/signin">
              <Button size="lg" className="h-12 px-8 text-lg bg-white text-primary hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-lg border-white text-white hover:bg-white/10"
              onClick={() => setIsDemoOpen(true)}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Hear a Demo
            </Button>
          </div>
          <p className="mt-8 text-sm text-white/75">
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