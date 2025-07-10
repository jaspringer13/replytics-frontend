"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { Star, Quote } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/AnimatedCounter"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Owner, Bella's Salon",
    content: "We went from missing 40% of calls to answering 100%. Our bookings increased by 60% in the first month. Game changer!",
    rating: 5
  },
  {
    name: "Dr. Michael Chen",
    role: "Dentist, Smile Dental Clinic",
    content: "Patients love the instant response and easy scheduling. It's like having a world-class receptionist 24/7.",
    rating: 5
  },
  {
    name: "Emma Rodriguez",
    role: "Manager, AutoCare Plus",
    content: "The AI handles our high call volume perfectly. Our team can focus on repairs while never missing a customer.",
    rating: 5
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export function TestimonialSection() {
  return (
    <section className="py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Loved by Businesses Everywhere
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of businesses that have transformed their customer service with Replytics
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="relative h-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-brand-500/30 transition-all duration-300">
                {/* Gradient glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                
                <div className="relative z-10">
                  {/* Quote icon */}
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-brand-500/20" />
                  
                  {/* Rating stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats section with animated counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: 99.9, label: "Uptime", suffix: "%", decimals: 1 },
            { value: 60, label: "More Bookings", suffix: "%", decimals: 0 },
            { value: 4.9, label: "Customer Rating", suffix: "/5", decimals: 1 },
            { value: 24, label: "Availability", suffix: "/7", decimals: 0 }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <p className="text-5xl font-bold text-brand-400">
                <AnimatedCounter 
                  end={stat.value} 
                  suffix={stat.suffix} 
                  decimals={stat.decimals}
                  duration={2000}
                />
              </p>
              <p className="text-gray-400 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}