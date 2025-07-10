"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Search, Send, User, Clock, 
  Phone, ChevronLeft, Loader2, AlertCircle
} from 'lucide-react'
import { useSMSConversations } from '@/hooks/useBackendData'
import { SMS } from '@/lib/api-client'
import { subscribeToConversation } from '@/lib/supabase-client'

interface Conversation {
  id: string
  phoneNumber: string
  customerName?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: SMS[]
}

export default function SMSPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { 
    data: messages, 
    loading, 
    error, 
    refetch 
  } = useSMSConversations(selectedConversation ?? undefined)

  // Group messages by conversation
  const conversations = useGroupMessagesByConversation(messages)
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.phoneNumber.includes(searchQuery) ||
    conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    setSending(true)
    try {
      // In a real implementation, this would call the backend API
      console.log('Sending message:', newMessage)
      setNewMessage('')
      // The message will appear via real-time subscription
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-140px)]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white">SMS Messages</h1>
            <p className="text-gray-400">Manage SMS conversations with your clients</p>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
            <div className="flex h-full">
              {/* Conversations List */}
              <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-700`}>
                {/* Search */}
                <div className="p-4 border-b border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {loading && conversations.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-gray-400">Failed to load conversations</p>
                      </div>
                    </div>
                  ) : filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation) => (
                      <motion.button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`w-full p-4 text-left hover:bg-gray-700/50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-gray-700/50' : ''
                        }`}
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-white font-medium">
                              {conversation.customerName || 'Unknown'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{conversation.phoneNumber}</p>
                        <p className="text-sm text-gray-300 truncate">{conversation.lastMessage}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-block mt-2 px-2 py-1 bg-brand-500/20 text-brand-400 text-xs rounded-full">
                            {conversation.unreadCount} new
                          </span>
                        )}
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No conversations found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat View */}
              {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                      </button>
                      <div>
                        <h3 className="text-white font-medium">
                          {conversations.find(c => c.id === selectedConversation)?.customerName || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {conversations.find(c => c.id === selectedConversation)?.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all">
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnimatePresence>
                      {messages
                        .filter(msg => msg.conversationId === selectedConversation)
                        .map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${
                              message.direction === 'outbound'
                                ? 'bg-brand-500/20 text-white'
                                : 'bg-gray-700/50 text-gray-300'
                            } rounded-lg p-3`}>
                              <p className="text-sm">{message.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  {formatTime(message.timestamp)}
                                </span>
                                {message.direction === 'outbound' && (
                                  <span className={`text-xs ${
                                    message.status === 'delivered' ? 'text-green-400' :
                                    message.status === 'sent' ? 'text-blue-400' :
                                    'text-red-400'
                                  }`}>
                                    {message.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        disabled={sending}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 hidden md:flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Select a conversation</h3>
                    <p className="text-gray-400">Choose a conversation from the list to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Helper hook to group messages by conversation
function useGroupMessagesByConversation(messages: SMS[]): Conversation[] {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    const grouped: { [key: string]: SMS[] } = {}
    
    messages.forEach(message => {
      if (!grouped[message.conversationId]) {
        grouped[message.conversationId] = []
      }
      grouped[message.conversationId].push(message)
    })

    const convs: Conversation[] = Object.entries(grouped).map(([id, msgs]) => {
      const sortedMessages = msgs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      
      const lastMessage = sortedMessages[0]
      const unreadCount = msgs.filter(m => m.direction === 'inbound' && m.status === 'received').length

      return {
        id,
        phoneNumber: lastMessage.phoneNumber,
        customerName: lastMessage.customerName,
        lastMessage: lastMessage.message,
        lastMessageTime: lastMessage.timestamp,
        unreadCount,
        messages: sortedMessages
      }
    })

    setConversations(convs.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    ))
  }, [messages])

  return conversations
}