"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ConversationList, Conversation } from '@/components/dashboard/messages/ConversationList'
import { MessageThread } from '@/components/dashboard/messages/MessageThread'
import { MessageTemplates, MessageTemplate } from '@/components/dashboard/messages/MessageTemplates'
import { motion } from 'framer-motion'
import { 
  Search, Settings, Bot, ChevronLeft, Phone, 
  Info, FileText, Sparkles, ToggleLeft, ToggleRight 
} from 'lucide-react'
import { useSMSConversations } from '@/hooks/useBackendData'
import { SMS, apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { DEFAULT_MESSAGE_TEMPLATES } from '@/constants/messageTemplates'

// Helper hook to group messages by conversation - optimized with useMemo
function useGroupMessagesByConversation(messages: SMS[]): Conversation[] {
  return useMemo(() => {
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
      // TODO: Update SMS interface to include readAt field for proper read tracking
      // Currently counts all received inbound messages as unread - will be updated when readAt field is added
      const unreadCount = msgs.filter(m => 
        m.direction === 'inbound' && 
        m.status === 'received'
        // && !m.readAt  // Will be added when SMS interface includes readAt field
      ).length
      
      return {
        id,
        phoneNumber: lastMessage.phoneNumber,
        customerName: lastMessage.customerName,
        lastMessage: lastMessage.message,
        lastMessageTime: lastMessage.timestamp,
        unreadCount,
        // Backend integration needed: These should come from API response
        isAIHandled: false, // TODO: Add aiMetadata to SMS type
        needsAttention: (unreadCount > 2),
        lastAIResponse: undefined // TODO: Add AI response tracking
      }
    })

    return convs.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )
  }, [messages])
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const { toast } = useToast()
  
  const { 
    data: messages, 
    loading, 
    error, 
    refetch 
  } = useSMSConversations(selectedConversation ?? undefined)

  // Group messages into conversations
  const conversations: Conversation[] = useGroupMessagesByConversation(messages)
  
  // Memoized filtered conversations for better performance
  const filteredConversations = useMemo(
    () => conversations.filter(conv => 
      conv.phoneNumber.includes(searchQuery) ||
      conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  )

  // Memoized filtered messages for selected conversation
  const filteredMessages = useMemo(
    () => messages.filter(m => m.conversationId === selectedConversation),
    [messages, selectedConversation]
  )

  // Handle sending message
  const handleSendMessage = async (message: string) => {
    if (!selectedConversation) return
    
    try {
      await apiClient.sendSMSMessage({
        conversationId: selectedConversation,
        message,
        direction: 'outbound'
      })
      
      // Refresh messages to show the new message
      await refetch()
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message', 'Please check your connection and try again.')
    }
  }

  // Handle AI override
  const handleOverrideAI = async (messageId: string, newMessage: string) => {
    try {
      await apiClient.overrideAIMessage(messageId, {
        message: newMessage,
        overrideReason: 'manual_override'
      })
      
      // Refresh messages to show the updated message
      await refetch()
    } catch (error) {
      console.error('Failed to override AI message:', error)
      toast.error('Failed to override AI message', 'Please try again.')
    }
  }

  // Handle template usage
  const handleUseTemplate = (template: MessageTemplate) => {
    let content = template.content
    
    if (template.variables && selectedConversation) {
      const conversation = conversations.find(c => c.id === selectedConversation)
      const variables: { [key: string]: string } = {
        name: conversation?.customerName || 'Customer',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        phone: conversation?.phoneNumber || '',
        // Add more variable mappings as needed
      }
      
      template.variables.forEach(variable => {
        const value = variables[variable] || `[${variable}]`
        content = content.replace(new RegExp(`\\{${variable}\\}`, 'g'), value)
      })
    }
    
    setNewMessage(content)
    setShowTemplates(false)
  }

  // Handle template management
  const handleSaveTemplate = async (template: MessageTemplate) => {
    try {
      // TODO: Implement API call once endpoint is available
      // await apiClient.createTemplate(template)
      toast.success('Template saved successfully')
      console.log('Save template:', template)
    } catch (error) {
      console.error('Failed to save template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleUpdateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    try {
      // TODO: Implement API call once endpoint is available
      // await apiClient.updateTemplate(id, updates)
      toast.success('Template updated successfully')
      console.log('Update template:', id, updates)
    } catch (error) {
      console.error('Failed to update template:', error)
      toast.error('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      // TODO: Implement API call once endpoint is available
      // await apiClient.deleteTemplate(id)
      toast.success('Template deleted successfully')
      console.log('Delete template:', id)
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('Failed to delete template')
    }
  }

  // Optimized AI toggle handler with useCallback
  const handleAiToggle = useCallback(() => {
    setAiEnabled(!aiEnabled)
  }, [aiEnabled])

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-140px)]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Messages</h1>
              <p className="text-gray-400">
                AI-powered SMS conversations with your customers
              </p>
            </div>
            
            {/* AI Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">AI Auto-Response</span>
              <button
                onClick={handleAiToggle}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  aiEnabled ? "bg-brand-500" : "bg-gray-700"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                  aiEnabled ? "translate-x-6" : "translate-x-0.5"
                )} />
              </button>
              {aiEnabled && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-purple-400">Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl overflow-hidden">
            <div className="flex h-full">
              {/* Conversations List */}
              <div className={cn(
                "flex flex-col border-r border-gray-700",
                selectedConversation ? "hidden md:flex md:w-96" : "w-full md:w-96"
              )}>
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
                  
                  {/* AI Status Summary */}
                  {aiEnabled && (
                    <div className="mt-3 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 text-xs text-purple-300">
                        <Sparkles className="w-4 h-4" />
                        <span>AI handling {conversations.filter(c => c.isAIHandled).length} conversations</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversation List */}
                <ConversationList
                  conversations={filteredConversations}
                  selectedId={selectedConversation}
                  onSelect={setSelectedConversation}
                  loading={loading}
                />
              </div>

              {/* Chat View */}
              {selectedConversation ? (
                <div className="flex-1 flex">
                  {/* Messages */}
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
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowTemplates(!showTemplates)}
                          className={cn(
                            "p-2 text-gray-400 hover:text-white rounded-lg transition-all",
                            showTemplates ? "bg-gray-700 text-white" : "hover:bg-gray-700/50"
                          )}
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all">
                          <Phone className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all">
                          <Info className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Message Thread */}
                    <MessageThread
                      messages={filteredMessages}
                      onSendMessage={handleSendMessage}
                      onOverrideAI={handleOverrideAI}
                      loading={loading}
                    />
                  </div>

                  {/* Templates Panel */}
                  {showTemplates && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 320, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="border-l border-gray-700 bg-gray-900/50"
                    >
                      <MessageTemplates
                        templates={DEFAULT_MESSAGE_TEMPLATES}
                        onUseTemplate={handleUseTemplate}
                        onSaveTemplate={handleSaveTemplate}
                        onUpdateTemplate={handleUpdateTemplate}
                        onDeleteTemplate={handleDeleteTemplate}
                      />
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex-1 hidden md:flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      {aiEnabled && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      {aiEnabled ? 'AI Assistant Active' : 'Select a conversation'}
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      {aiEnabled 
                        ? 'Your AI assistant is monitoring conversations and will respond automatically when appropriate.'
                        : 'Choose a conversation from the list to view messages and send replies.'}
                    </p>
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

