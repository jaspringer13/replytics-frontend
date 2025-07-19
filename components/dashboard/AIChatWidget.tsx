"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, X, Send, Mic, MicOff, Sparkles, 
  Loader2, AlertCircle, ArrowRight, Calendar,
  Users, DollarSign, Phone, Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCustomers } from '@/hooks/useCustomers'
import type { Customer } from '@/app/models/dashboard'
import { apiClient } from '@/lib/api-client'

// Speech Recognition type definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  actions?: Action[]
  isLoading?: boolean
  error?: boolean
}

interface Action {
  type: 'navigate' | 'update' | 'query'
  label: string
  href?: string
  data?: any
}

// Pre-defined suggestions
const suggestions = [
  "Show me today's appointments",
  "Who are my top customers?",
  "How is revenue trending?",
  "Any customers need attention?",
  "Update my voice settings",
  "Show missed calls"
]

export function AIChatWidget() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const MAX_MESSAGES = 100; // Limit message history
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your AI business assistant. I can help you understand your data, find insights, and manage settings. What would you like to know?",
      role: 'assistant',
      timestamp: new Date()
    }
  ])

  // Add message with history limit
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Keep only the last MAX_MESSAGES
      return newMessages.slice(-MAX_MESSAGES);
    });
  }, []);
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }

    addMessage(userMessage)
    setInput('')
    setIsProcessing(true)

    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString() + '-loading',
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true
    }
    addMessage(loadingMessage)

    // Process the query
    try {
      const response = await processQuery(userMessage.content)
      
      // Remove loading message and add response
      setMessages(prev => 
        prev.filter(m => !m.isLoading).concat(response)
      )
    } catch (error) {
      // Remove loading message and add error
      setMessages(prev => 
        prev.filter(m => !m.isLoading).concat({
          id: Date.now().toString(),
          content: "I encountered an error processing your request. Please try again.",
          role: 'assistant',
          timestamp: new Date(),
          error: true
        })
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Process natural language query
  const processQuery = async (query: string): Promise<Message> => {
    // TODO: Replace with actual AI/NLP service integration
    // Current implementation uses keyword matching for demo purposes
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const lowerQuery = query.toLowerCase()
    
    // Navigation queries
    if (lowerQuery.includes('appointment') || lowerQuery.includes('schedule')) {
      return {
        id: Date.now().toString(),
        content: "I'll show you today's appointments. You have 8 appointments scheduled.",
        role: 'assistant',
        timestamp: new Date(),
        actions: [{
          type: 'navigate',
          label: 'View Calendar',
          href: '/dashboard/calendar'
        }]
      }
    }
    
    if (lowerQuery.includes('customer') && (lowerQuery.includes('top') || lowerQuery.includes('best'))) {
      try {
        const result = await apiClient.getCustomers({
          sortBy: 'lifetimeValue',
          sortOrder: 'desc',
          pageSize: 3
        });

        if (result.customers && result.customers.length > 0) {
          const topCustomers = result.customers.slice(0, 3);
          const customerList = topCustomers.map(customer => {
            const name = customer.firstName && customer.lastName 
              ? `${customer.firstName} ${customer.lastName}`
              : customer.firstName || customer.lastName || 'Unknown Customer';
            return `${name} ($${customer.lifetimeValue.toLocaleString()})`;
          }).join(', ');

          const segmentInfo = topCustomers.every(c => c.segment === 'vip') 
            ? "They're all VIP customers with high retention."
            : "These are your most valuable customers.";

          return {
            id: Date.now().toString(),
            content: `Your top customers by lifetime value are ${customerList}. ${segmentInfo}`,
            role: 'assistant',
            timestamp: new Date(),
            actions: [{
              type: 'navigate',
              label: 'View All Customers',
              href: '/dashboard/customers?segment=vip'
            }]
          };
        } else {
          return {
            id: Date.now().toString(),
            content: "I couldn't find your customer data at the moment. This might be because you're just getting started or there's a temporary issue accessing the data.",
            role: 'assistant',
            timestamp: new Date(),
            actions: [{
              type: 'navigate',
              label: 'View Customers',
              href: '/dashboard/customers'
            }]
          };
        }
      } catch (error) {
        console.error('Failed to fetch top customers:', error);
        return {
          id: Date.now().toString(),
          content: "I'm having trouble accessing your customer data right now. Please try again in a moment, or check your customers page directly.",
          role: 'assistant',
          timestamp: new Date(),
          actions: [{
            type: 'navigate',
            label: 'View Customers',
            href: '/dashboard/customers'
          }]
        };
      }
    }
    
    if (lowerQuery.includes('revenue')) {
      return {
        id: Date.now().toString(),
        content: "I'll help you check your revenue data. This feature is currently showing example data until integrated with your analytics.",
        role: 'assistant',
        timestamp: new Date(),
        actions: [{
          type: 'navigate',
          label: 'View Analytics',
          href: '/dashboard/analytics'
        }]
      }
    }
    
    if (lowerQuery.includes('missed call')) {
      return {
        id: Date.now().toString(),
        content: "I'll help you check your missed calls. This feature is currently showing example data until integrated with your call system.",
        role: 'assistant',
        timestamp: new Date(),
        actions: [{
          type: 'navigate',
          label: 'View Missed Calls',
          href: '/dashboard/calls?filter=missed'
        }]
      }
    }
    
    if (lowerQuery.includes('voice') && lowerQuery.includes('setting')) {
      return {
        id: Date.now().toString(),
        content: "I can help you update your voice settings. What would you like to change? You can adjust the voice style, speed, or conversation rules.",
        role: 'assistant',
        timestamp: new Date(),
        actions: [{
          type: 'navigate',
          label: 'Open Voice Settings',
          href: '/dashboard/settings?tab=voice'
        }]
      }
    }
    
    // Default response
    return {
      id: Date.now().toString(),
      content: "I understand you're asking about '" + query + "'. I'm continuously learning to better assist you. Try asking about appointments, customers, revenue, or settings.",
      role: 'assistant',
      timestamp: new Date()
    }
  }

  // Handle voice input
  const handleVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error('Voice input is not supported in your browser')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      return
    }

    setIsListening(true)
    recognition.start()

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }
  }

  // Handle action clicks
  const handleAction = (action: Action) => {
    if (action.type === 'navigate' && action.href) {
      router.push(action.href)
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-brand-600 hover:bg-brand-700 rounded-full shadow-lg flex items-center justify-center group transition-colors"
          >
            <div className="relative">
              <MessageSquare className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-brand-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-600" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Assistant</h3>
                  <p className="text-xs text-brand-200">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.role === 'user'
                      ? "bg-brand-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  )}>
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
                        {message.actions && (
                          <div className="mt-2 space-y-1">
                            {message.actions.map((action, index) => (
                              <button
                                key={index}
                                onClick={() => handleAction(action)}
                                className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors w-full"
                              >
                                <ArrowRight className="w-3 h-3" />
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-500 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="w-full px-4 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleVoiceInput}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                      isListening
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by AI • Your data is secure
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}