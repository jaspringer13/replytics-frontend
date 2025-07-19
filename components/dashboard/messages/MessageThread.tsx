"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Clock, Bot, User, AlertCircle, CheckCircle, 
  Edit2, RefreshCw, Sparkles
} from 'lucide-react'
import { SMS } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface MessageThreadProps {
  messages: SMS[]
  onSendMessage: (message: string) => Promise<void>
  onOverrideAI?: (messageId: string, newMessage: string) => Promise<void>
  loading?: boolean
}

interface AIMessageMetadata {
  isAI: boolean
  confidence?: number
  suggestedResponse?: string
  overridden?: boolean
}

// Extend SMS type locally for AI metadata
interface ExtendedSMS extends SMS {
  aiMetadata?: AIMessageMetadata
}

export function MessageThread({ 
  messages, 
  onSendMessage, 
  onOverrideAI,
  loading = false 
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editedMessage, setEditedMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    try {
      await onSendMessage(newMessage)
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleOverrideAI = async (messageId: string) => {
    if (!editedMessage.trim() || !onOverrideAI) return
    
    try {
      await onOverrideAI(messageId, editedMessage)
      setEditingMessageId(null)
      setEditedMessage('')
    } catch (error) {
      console.error('Failed to override AI message:', error)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  // Mock AI metadata for demo - in real app this would come from backend
  const enhancedMessages: ExtendedSMS[] = messages.map(msg => ({
    ...msg,
    aiMetadata: msg.direction === 'outbound' && Math.random() > 0.5 ? {
      isAI: true,
      confidence: Math.random() * 40 + 60,
      overridden: false
    } : undefined
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {enhancedMessages.map((message, index) => {
            const isOutbound = message.direction === 'outbound'
            const isAI = message.aiMetadata?.isAI
            const isEditing = editingMessageId === message.id

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex",
                  isOutbound ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[70%] rounded-lg p-3",
                  isOutbound
                    ? "bg-brand-500/20"
                    : "bg-gray-700/50"
                )}>
                  {/* AI Indicator */}
                  {isAI && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full">
                        <Bot className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-400">AI Response</span>
                        {message.aiMetadata?.confidence && (
                          <span className="text-xs text-purple-300">
                            {message.aiMetadata.confidence.toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {message.aiMetadata?.overridden && (
                        <span className="text-xs text-orange-400 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          Edited
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOverrideAI(message.id)}
                          className="px-3 py-1 bg-brand-500 text-white rounded text-sm hover:bg-brand-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null)
                            setEditedMessage('')
                          }}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={cn(
                        "text-sm",
                        isOutbound ? "text-white" : "text-gray-300"
                      )}>
                        {message.message}
                      </p>

                      {/* Message Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                          {isOutbound && (
                            <span className={cn(
                              "text-xs flex items-center gap-1",
                              message.status === 'delivered' ? 'text-green-400' :
                              message.status === 'sent' ? 'text-blue-400' :
                              message.status === 'failed' ? 'text-red-400' :
                              'text-gray-400'
                            )}>
                              {message.status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                              {message.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                              {message.status}
                            </span>
                          )}
                        </div>

                        {/* AI Actions */}
                        {isAI && onOverrideAI && !isEditing && (
                          <button
                            onClick={() => {
                              setEditingMessageId(message.id)
                              setEditedMessage(message.message)
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Edit AI response"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-xs text-gray-400">AI is typing...</span>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="w-full px-4 py-2 pr-10 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              disabled={sending}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-400 transition-colors"
              title="AI will auto-respond when available"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI auto-response is enabled. Messages will be sent automatically when appropriate.
        </p>
      </div>
    </div>
  )
}