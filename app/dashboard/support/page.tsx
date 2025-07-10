"use client"

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  HelpCircle, MessageSquare, Mail, Phone, Book, 
  FileText, Zap, Shield, Clock, Send, Search,
  ChevronRight, CheckCircle, AlertTriangle, Info,
  ExternalLink, Loader2, CreditCard, Check, X
} from 'lucide-react'

// FAQ categories and questions
const faqCategories = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: Zap,
    questions: [
      {
        q: "How do I set up my AI receptionist?",
        a: "Setting up your AI receptionist is simple! Go to Settings > AI Configuration to customize your greeting message, business hours, and voice settings. Your AI will be ready to answer calls immediately."
      },
      {
        q: "Can I customize the AI voice?",
        a: "Yes! We offer multiple voice options including Professional, Friendly, Casual, and Formal tones. You can change this in Settings > AI Configuration > Voice Settings."
      },
      {
        q: "How do I add my business information?",
        a: "Navigate to Settings > Business Info to add your business name, phone number, address, and operating hours. This helps the AI provide accurate information to callers."
      }
    ]
  },
  {
    id: "billing",
    name: "Billing & Plans",
    icon: CreditCard,
    questions: [
      {
        q: "How does billing work?",
        a: "We bill monthly based on your selected plan. Your subscription renews automatically on the same date each month. You can view your billing history and manage payments in the Billing section."
      },
      {
        q: "Can I change my plan anytime?",
        a: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference for the current billing period."
      },
      {
        q: "What happens if I exceed my minutes?",
        a: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional minutes. Your AI receptionist will never stop working unexpectedly."
      }
    ]
  },
  {
    id: "features",
    name: "Features & Usage",
    icon: Shield,
    questions: [
      {
        q: "Can the AI book appointments?",
        a: "Yes! The AI can check availability and book appointments directly into your calendar. Enable this feature in Settings > AI Configuration > AI Features."
      },
      {
        q: "How do I access call recordings?",
        a: "Call recordings are available in the Calls section. Click the play button next to any call to listen to the recording or view the transcript."
      },
      {
        q: "Can I forward calls to my phone?",
        a: "Yes, you can set up call forwarding rules based on time, caller, or specific keywords. Configure this in Settings > Call Handling."
      }
    ]
  }
]

// System status items
const systemStatus = [
  { service: "AI Receptionist", status: "operational", uptime: "99.9%" },
  { service: "Call Processing", status: "operational", uptime: "99.8%" },
  { service: "SMS Notifications", status: "operational", uptime: "100%" },
  { service: "Calendar Sync", status: "maintenance", uptime: "98.5%" }
]

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState("getting-started")
  const [searchQuery, setSearchQuery] = useState("")
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    priority: "normal"
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000))
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 5000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-green-400"
      case "maintenance": return "text-yellow-400"
      case "outage": return "text-red-400"
      default: return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return <CheckCircle className="w-4 h-4" />
      case "maintenance": return <AlertTriangle className="w-4 h-4" />
      case "outage": return <X className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
          <p className="text-gray-400">Get help with your AI receptionist and find answers to common questions</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.a
            href="https://docs.replytics.ai"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 transition-all group"
          >
            <Book className="w-8 h-8 text-brand-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Documentation</h3>
            <p className="text-sm text-gray-400">Detailed guides and API references</p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm text-brand-400 group-hover:text-brand-300">
              Read docs <ExternalLink className="w-3 h-3" />
            </span>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl"
          >
            <MessageSquare className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Live Chat</h3>
            <p className="text-sm text-gray-400">Chat with our support team</p>
            <button className="inline-flex items-center gap-1 mt-3 text-sm text-purple-400 hover:text-purple-300">
              Start chat <ChevronRight className="w-3 h-3" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl"
          >
            <Phone className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">Phone Support</h3>
            <p className="text-sm text-gray-400">Mon-Fri, 9AM-6PM EST</p>
            <a href="tel:1-800-REPLYTICS" className="inline-flex items-center gap-1 mt-3 text-sm text-green-400 hover:text-green-300">
              1-800-REPLYTICS
            </a>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
              
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>

              {/* Category tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {faqCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      selectedCategory === category.id 
                        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {faqCategories
                  .find(cat => cat.id === selectedCategory)
                  ?.questions.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 bg-gray-700/30 rounded-lg"
                    >
                      <h3 className="text-white font-medium mb-2 flex items-start gap-2">
                        <HelpCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                        {item.q}
                      </h3>
                      <p className="text-sm text-gray-400 ml-7">{item.a}</p>
                    </motion.div>
                  ))}
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 mt-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Contact Support</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={contactForm.priority}
                    onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                  >
                    <option value="low">Low - General question</option>
                    <option value="normal">Normal - Need help</option>
                    <option value="high">High - Service issue</option>
                    <option value="urgent">Urgent - Service down</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
                    placeholder="Describe your issue in detail..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending || sent}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-600 text-white rounded-lg transition-all disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : sent ? (
                    <>
                      <Check className="w-4 h-4" />
                      Message Sent!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 h-fit"
          >
            <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
            
            <div className="space-y-3">
              {systemStatus.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{item.service}</p>
                      <p className="text-xs text-gray-400">Uptime: {item.uptime}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'operational' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <a
              href="https://status.replytics.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              View full status page <ExternalLink className="w-3 h-3" />
            </a>

            {/* Emergency Contact */}
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 font-medium mb-1">Emergency Support</p>
              <p className="text-xs text-gray-300">For critical issues affecting service:</p>
              <a href="tel:1-800-CRITICAL" className="text-sm text-red-400 hover:text-red-300 font-medium">
                1-800-CRITICAL
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}