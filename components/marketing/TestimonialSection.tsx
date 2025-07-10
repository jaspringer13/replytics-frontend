"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"
import Image from "next/image"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Owner, Bella's Salon",
    image: "/testimonials/sarah.jpg",
    content: "We went from missing 40% of calls to answering 100%. Our bookings increased by 60% in the first month. Game changer!",
    rating: 5
  },
  {
    name: "Dr. Michael Chen",
    role: "Dentist, Smile Dental Clinic",
    image: "/testimonials/michael.jpg",
    content: "Patients love the instant response and easy scheduling. It's like having a world-class receptionist 24/7.",
    rating: 5
  },
  {
    name: "Emma Rodriguez",
    role: "Manager, AutoCare Plus",
    image: "/testimonials/emma.jpg",
    content: "The AI handles our high call volume perfectly. Our team can focus on repairs while never missing a customer.",
    rating: 5
  }
]

export function TestimonialSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Loved by Businesses Everywhere
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of businesses that have transformed their customer service with Replytics
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="relative h-full p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Quote icon */}
                <Quote className="absolute top-6 right-6 w-8 h-8 text-brand-100" />
                
                {/* Rating stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-200 to-brand-300 flex items-center justify-center">
                    <span className="text-brand-700 font-semibold text-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "60%", label: "More Bookings" },
            { value: "4.9/5", label: "Customer Rating" },
            { value: "24/7", label: "Availability" }
          ].map((stat, index) => (
            <div key={index}>
              <p className="text-4xl font-bold text-brand-600 mb-2">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}