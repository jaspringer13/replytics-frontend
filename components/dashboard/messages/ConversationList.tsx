"use client"

import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { User, Bot, Clock, MessageSquare, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/time-utils'
import { AI_CONFIDENCE } from '@/lib/constants'

export interface Conversation {
  id: string
  phoneNumber: string
  customerName?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isAIHandled?: boolean
  needsAttention?: boolean
  lastAIResponse?: {
    timestamp: string
    confidence: number
  }
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
}

export function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  loading = false 
}: ConversationListProps) {

  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => {
    // Prioritize conversations that need attention
    if (a.needsAttention && !b.needsAttention) return -1
    if (!a.needsAttention && b.needsAttention) return 1
    
    // Then by unread count
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1
    
    // Finally by time
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  }), [conversations])

  if (loading && conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-700 animate-pulse">
            <div className="flex items-start justify-between mb-2">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
              <div className="h-3 bg-gray-700 rounded w-12"></div>
            </div>
            <div className="h-3 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No conversations yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Messages will appear here when customers text you
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sortedConversations.map((conversation, index) => (
        <motion.button
          key={conversation.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(index * 0.05, 0.5) }}
          onClick={() => onSelect(conversation.id)}
          aria-label={`Conversation with ${conversation.customerName || conversation.phoneNumber}, ${conversation.unreadCount} unread messages, last message: ${conversation.lastMessage}`}
          role="button"
          tabIndex={0}
          className={cn(
            "w-full p-4 text-left hover:bg-gray-700/50 transition-colors relative",
            selectedId === conversation.id && "bg-gray-700/50",
            conversation.needsAttention && "border-l-4 border-orange-500"
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 flex-1">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-white font-medium truncate">
                {conversation.customerName || conversation.phoneNumber || 'Unknown'}
              </span>
              {conversation.isAIHandled && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded-full">
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-400">AI</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatRelativeTime(conversation.lastMessageTime)}
            </span>
          </div>

          {/* Phone Number */}
          <p className="text-sm text-gray-400 mb-1">{conversation.phoneNumber}</p>

          {/* Last Message */}
          <p className="text-sm text-gray-300 truncate pr-8">
            {conversation.lastMessage}
          </p>

          {/* Indicators */}
          <div className="flex items-center gap-2 mt-2">
            {conversation.unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-brand-500/20 text-brand-400 text-xs rounded-full font-medium">
                {conversation.unreadCount} new
              </span>
            )}
            {conversation.needsAttention && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                <AlertCircle className="w-3 h-3" />
                Needs review
              </span>
            )}
            {conversation.lastAIResponse && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                AI: {formatRelativeTime(conversation.lastAIResponse.timestamp)}
                {conversation.lastAIResponse.confidence < AI_CONFIDENCE.LOW_THRESHOLD && (
                  <span className="text-orange-400">
                    ({conversation.lastAIResponse.confidence}%)
                  </span>
                )}
              </span>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  )
}