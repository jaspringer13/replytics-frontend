"use client"

import { useState, useEffect } from 'react'
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
import { SMS } from '@/lib/api-client'
import { cn } from '@/lib/utils'

// Mock templates - in real app these would come from API
const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Appointment Confirmation',
    content: 'Hi {name}, this is a reminder of your appointment tomorrow at {time}. Reply Y to confirm or N to reschedule.',
    category: 'appointment',
    variables: ['name', 'time']
  },
  {
    id: '2',
    name: 'Welcome Message',
    content: 'Welcome to our service! We\'re excited to have you. Feel free to text us anytime with questions.',
    category: 'greeting',
    isAIGenerated: true
  },
  {
    id: '3',
    name: 'Follow-up',
    content: 'Hi {name}, thank you for visiting us today! We hope you had a great experience. See you next time!',
    category: 'follow-up',
    variables: ['name']
  }
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  
  const { 
    data: messages, 
    loading, 
    error, 
    refetch 
  } = useSMSConversations(selectedConversation ?? undefined)

  // Group messages into conversations
  const conversations: Conversation[] = useGroupMessagesByConversation(messages)
  
  // Filter conversations
  const filteredConversations = conversations.filter(conv => 
    conv.phoneNumber.includes(searchQuery) ||
    conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle sending message
  const handleSendMessage = async (message: string) => {
    console.log('Sending message:', message)
    // In real app, this would call the API
  }

  // Handle AI override
  const handleOverrideAI = async (messageId: string, newMessage: string) => {
    console.log('Overriding AI message:', messageId, newMessage)
    // In real app, this would call the API
  }

  // Handle template usage
  const handleUseTemplate = (template: MessageTemplate) => {
    let content = template.content
    // Simple variable replacement - in real app this would be more sophisticated
    if (template.variables) {
      template.variables.forEach(variable => {
        content = content.replace(`{${variable}}`, `[${variable}]`)
      })
    }
    setNewMessage(content)
    setShowTemplates(false)
  }

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
                onClick={() => setAiEnabled(!aiEnabled)}
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
                      messages={messages.filter(m => m.conversationId === selectedConversation)}
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
                        templates={mockTemplates}
                        onUseTemplate={handleUseTemplate}
                        onSaveTemplate={(template) => console.log('Save template:', template)}
                        onUpdateTemplate={(id, updates) => console.log('Update template:', id, updates)}
                        onDeleteTemplate={(id) => console.log('Delete template:', id)}
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
      
      // Mock AI data - in real app this would come from backend
      const isAIHandled = Math.random() > 0.5
      const needsAttention = unreadCount > 2 || Math.random() > 0.8
      const lastAIResponse = isAIHandled && Math.random() > 0.5 ? {
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        confidence: Math.random() * 40 + 60
      } : undefined

      return {
        id,
        phoneNumber: lastMessage.phoneNumber,
        customerName: lastMessage.customerName,
        lastMessage: lastMessage.message,
        lastMessageTime: lastMessage.timestamp,
        unreadCount,
        isAIHandled,
        needsAttention,
        lastAIResponse
      }
    })

    setConversations(convs.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    ))
  }, [messages])

  return conversations
}