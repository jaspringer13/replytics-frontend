"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700" />
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Sparkle badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Limited Time: Get 3 Months Free</span>
          </motion.div>

          {/* Main heading */}
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto">
            Ready to Transform Your Business?
          </h2>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            Join thousands of businesses already using Replytics to deliver exceptional customer service 24/7
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Button
              size="lg"
              className="bg-white text-brand-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold backdrop-blur-sm transition-all duration-200"
            >
              Schedule a Demo
            </Button>
          </motion.div>

          {/* Trust text */}
          <p className="text-white/70 text-sm">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto"
        >
          {[
            { title: "1 Minute Setup", description: "Get started instantly with our quick onboarding" },
            { title: "Unlimited Calls", description: "Handle any volume with no per-minute charges" },
            { title: "24/7 Support", description: "Expert help whenever you need it" }
          ].map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/80 text-sm">{feature.description}</p>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  )
}