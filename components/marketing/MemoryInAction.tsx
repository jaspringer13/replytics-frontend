"use client"

import { motion } from "framer-motion"
import { Phone, User, Sparkles, UserCheck, Heart, Shield } from "lucide-react"

export function MemoryInAction() {
  return (
    <section className="py-24 bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Every Customer Feels Like a Regular
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Watch how our Memory Layer transforms a simple phone call into a personalized experience
          </p>
        </motion.div>

        {/* Memory demonstration */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Phone mockup with conversation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
              <div className="space-y-4">
                {/* Incoming call */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Incoming call from John (555-0123)</p>
                    <div className="bg-gray-700/50 rounded-lg p-3 mt-2">
                      <p className="text-white">
                        "Hey John! Welcome back. Ready for your usual Thursday afternoon haircut with Dory?"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer response */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-purple-500/20 rounded-lg p-3">
                      <p className="text-white">"Actually, can we do Friday morning instead?"</p>
                    </div>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <p className="text-white">
                        "Sure, no problem! He has a 10 and an 11:30 open. Which would you prefer?"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Memory features */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Instant Recognition</h3>
                <p className="text-gray-400">Greets every caller by name and recalls their complete history</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Remembers Preferences</h3>
                <p className="text-gray-400">Favorite services, preferred staff, and typical booking times</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure & Smart</h3>
                <p className="text-gray-400">Only authorized callers can modify their own appointments</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}