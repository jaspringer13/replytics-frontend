"use client"
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Back to home link */}
      <div className="fixed top-8 left-8 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-lg max-w-none"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300">
                Replytics AI, Inc. ("Replytics," "we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our AI-powered receptionist service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-white mb-2">2.1 Business Information</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Business name, address, and contact information</li>
                <li>Business hours and service offerings</li>
                <li>Calendar and scheduling preferences</li>
                <li>Staff information and availability</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-4">2.2 Caller Information</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Phone numbers for caller identification</li>
                <li>Names provided during calls</li>
                <li>Service preferences and appointment history</li>
                <li>Call recordings for quality and training purposes</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-4">2.3 Technical Data</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>IP addresses and browser information</li>
                <li>Device and connection information</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">We use collected information to:</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Provide and maintain our AI receptionist service</li>
                <li>Process appointments and send reminders</li>
                <li>Improve our AI's natural language processing</li>
                <li>Personalize caller experiences through our Memory Layer</li>
                <li>Send administrative communications</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Retention</h2>
              <p className="text-gray-300">
                We retain caller memory data to provide personalized service. Business owners can request 
                deletion of specific caller records at any time. Call recordings are retained for 90 days 
                unless otherwise specified by the business.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p className="text-gray-300">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
                <li>256-bit SSL encryption for all data transmission</li>
                <li>Encrypted storage of sensitive information</li>
                <li>Regular security audits and updates</li>
                <li>Strict access controls and authentication</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Third-Party Services</h2>
              <p className="text-gray-300">
                We integrate with trusted third-party services including:
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-2">
                <li>Twilio for voice and SMS services</li>
                <li>Google Calendar for scheduling</li>
                <li>OpenAI for natural language processing</li>
                <li>ElevenLabs for voice synthesis</li>
              </ul>
              <p className="text-gray-300 mt-2">
                Each service maintains its own privacy policy and security standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
              <p className="text-gray-300 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
              <p className="text-gray-300">
                For privacy-related questions or concerns, please contact us at:
              </p>
              <div className="mt-4 text-gray-300">
                <p>Email: privacy@replytics.ai</p>
                <p>Phone: 1-800-REPLYTICS</p>
                <p>Address: Replytics AI, Inc., Seattle, WA</p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}