"use client"

import { motion } from "framer-motion"
import { Phone, Calendar, MessageSquare, Zap, BarChart3, Globe } from "lucide-react"

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
    icon: Globe,
    title: "Smart Call Routing",
    description: "Direct calls to the right person every time with intelligent routing based on caller needs.",
    gradient: "from-red-400 to-red-600"
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export function FeatureGrid() {
  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Powerful features that transform how you handle customer calls
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div className="relative h-full bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:bg-gray-800/50 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300">
                {/* Gradient glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} from-opacity-20 to-opacity-20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-brand-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Learn more indicator */}
                  <div className="mt-4 flex items-center text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-sm font-medium">Learn more</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-400 mb-6">
            Plus enterprise features like API access, custom integrations, and white-label options
          </p>
          <motion.a 
            href="#" 
            className="inline-flex items-center text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            whileHover={{ x: 5 }}
          >
            See all features
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}