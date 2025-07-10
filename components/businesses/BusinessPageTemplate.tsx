"use client"
import { motion } from 'framer-motion'
import { Phone, Clock, Calendar, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface BusinessPageProps {
  title: string
  subtitle: string
  benefits: string[]
  testimonial: {
    quote: string
    author: string
  }
  features?: {
    title: string
    description: string
    icon: any
  }[]
}

export function BusinessPageTemplate({ 
  title, 
  subtitle, 
  benefits, 
  testimonial,
  features = [
    {
      title: "24/7 Availability",
      description: "Never miss a call, even during busy hours",
      icon: Phone
    },
    {
      title: "Smart Scheduling",
      description: "Book appointments automatically based on your availability",
      icon: Calendar
    },
    {
      title: "Instant Response",
      description: "Answer calls immediately, no wait times",
      icon: Clock
    },
    {
      title: "Business Growth",
      description: "Convert more leads into customers",
      icon: TrendingUp
    }
  ]
}: BusinessPageProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {title}
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button className="px-8 py-4 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="px-8 py-4 border-gray-600 text-white hover:bg-gray-800">
                  Book a Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-6 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Built for Your Business
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-brand-400" />
                </div>
                <p className="text-lg text-gray-300">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Features That Drive Results
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-brand-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6 bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl p-8 md:p-12"
          >
            <p className="text-2xl md:text-3xl text-white font-medium mb-6">
              "{testimonial.quote}"
            </p>
            <p className="text-gray-400">
              — {testimonial.author}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of businesses using Replytics to never miss a call
          </p>
          <Link href="/auth/signin">
            <Button className="px-8 py-4 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors inline-flex items-center gap-2">
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}