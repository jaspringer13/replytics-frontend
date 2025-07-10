"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Play, Sparkles, Check, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/Card"

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <section className="relative min-h-screen flex items-center bg-gray-900 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" 
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 30, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Animated badge */}
            <motion.div
              variants={itemVariants}
              className="inline-block mb-8"
            >
              <Badge className="px-4 py-2 text-sm font-medium bg-brand-500/10 text-brand-400 border-brand-500/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                </span>
                Trusted by 1,000+ service businesses
              </Badge>
            </motion.div>

            {/* Main headline with gradient */}
            <motion.h1
              variants={itemVariants}
              className="text-6xl sm:text-7xl lg:text-8xl font-black leading-tight tracking-tight text-white"
            >
              Your{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-brand-400 via-blue-400 to-brand-400 bg-clip-text text-transparent">
                  AI Receptionist
                </span>
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 w-full"
                  height="8"
                  viewBox="0 0 100 8"
                >
                  <motion.path
                    d="M0 4Q25 0 50 4T100 4"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#5EEAD4" />
                      <stop offset="50%" stopColor="#60A5FA" />
                      <stop offset="100%" stopColor="#5EEAD4" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </span>
              <br />
              Never Takes a Day Off
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="mt-8 text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              The only AI receptionist that knows your clients by name - remembering every detail
              so every call feels personal
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-brand-500 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl hover:shadow-brand-500/25 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold text-lg border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Hear a Demo
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="relative max-w-5xl mx-auto mt-20"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-brand-500/20 blur-3xl" />
            
            {/* Dashboard mockup */}
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8">
                {/* Fake dashboard header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div className="text-sm text-gray-500">Replytics Dashboard</div>
                </div>
                
                {/* Fake stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gray-800/50 rounded-xl p-6"
                  >
                    <div className="text-gray-400 text-sm mb-2">Calls Today</div>
                    <div className="text-3xl font-bold text-white">47</div>
                    <div className="text-xs text-green-400 mt-1">+12% from yesterday</div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gray-800/50 rounded-xl p-6"
                  >
                    <div className="text-gray-400 text-sm mb-2">Appointments Booked</div>
                    <div className="text-3xl font-bold text-white">23</div>
                    <div className="text-xs text-green-400 mt-1">98% success rate</div>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gray-800/50 rounded-xl p-6"
                  >
                    <div className="text-gray-400 text-sm mb-2">Avg Call Time</div>
                    <div className="text-3xl font-bold text-white">2:34</div>
                    <div className="text-xs text-blue-400 mt-1">Perfect efficiency</div>
                  </motion.div>
                </div>
                
                {/* Fake activity list */}
                <div className="space-y-3">
                  {[
                    { time: "2 min ago", name: "Sarah Johnson", action: "Booked appointment" },
                    { time: "5 min ago", name: "Mike Chen", action: "Asked about services" },
                    { time: "12 min ago", name: "Emma Davis", action: "Rescheduled visit" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                      className="bg-gray-800/30 rounded-lg p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-brand-500/40 rounded-full" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-gray-400 text-sm">{item.action}</div>
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm">{item.time}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}