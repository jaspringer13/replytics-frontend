"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Edit2, Trash2, Save, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const TEMPLATE_CATEGORIES = ['greeting', 'appointment', 'reminder', 'follow-up', 'custom'] as const
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]

export interface MessageTemplate {
  id: string
  name: string
  content: string
  category: TemplateCategory
  variables?: string[]
  isAIGenerated?: boolean
}

interface MessageTemplatesProps {
  templates: MessageTemplate[]
  onUseTemplate: (template: MessageTemplate) => void
  onSaveTemplate?: (template: Omit<MessageTemplate, 'id'>) => void
  onUpdateTemplate?: (id: string, template: Partial<MessageTemplate>) => void
  onDeleteTemplate?: (id: string) => void
}

const categoryColors = {
  greeting: 'bg-green-500/20 text-green-400 border-green-500/30',
  appointment: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  reminder: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'follow-up': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  custom: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export function MessageTemplates({
  templates,
  onUseTemplate,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate
}: MessageTemplatesProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    content: string;
    category: TemplateCategory;
  }>({
    name: '',
    content: '',
    category: 'custom'
  })

  const filteredTemplates = templates.filter(
    t => selectedCategory === 'all' || t.category === selectedCategory
  )

  const handleSave = () => {
    if (!newTemplate.name || !newTemplate.content) return
    
    onSaveTemplate?.(newTemplate)
    setNewTemplate({ name: '', content: '', category: 'custom' })
    setIsCreating(false)
  }

  const categories = ['all', ...TEMPLATE_CATEGORIES] as const

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Quick Responses</h3>
          {onSaveTemplate && (
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                selectedCategory === cat
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
              )}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {/* Create New Template */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-700/50 rounded-lg p-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Template name..."
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-brand-500"
              />
              <textarea
                placeholder="Message content..."
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-brand-500 resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as TemplateCategory })}
                  className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="greeting">Greeting</option>
                  <option value="appointment">Appointment</option>
                  <option value="reminder">Reminder</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-brand-500 text-white rounded text-sm hover:bg-brand-600 transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setNewTemplate({ name: '', content: '', category: 'custom' })
                    }}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Template Items */}
          {filteredTemplates.map((template, index) => {
            const isEditing = editingId === template.id
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors group"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent[template.id] ?? template.content}
                      onChange={(e) => setEditingContent(prev => ({ ...prev, [template.id]: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onUpdateTemplate?.(template.id, { content: editingContent[template.id] ?? template.content })
                          setEditingContent(prev => {
                            const { [template.id]: _, ...rest } = prev
                            return rest
                          })
                          setEditingId(null)
                        }}
                        className="px-3 py-1 bg-brand-500 text-white rounded text-sm hover:bg-brand-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingContent(prev => {
                            const { [template.id]: _, ...rest } = prev
                            return rest
                          })
                          setEditingId(null)
                        }}
                        className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-sm hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-white">{template.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium border",
                          categoryColors[template.category]
                        )}>
                          {template.category}
                        </span>
                        {template.isAIGenerated && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onUpdateTemplate && (
                          <button
                            onClick={() => setEditingId(template.id)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteTemplate && (
                          <button
                            onClick={() => onDeleteTemplate(template.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">{template.content}</p>
                    <button
                      onClick={() => onUseTemplate(template)}
                      className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Use this template
                    </button>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No templates found</p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-sm text-brand-400 hover:text-brand-300 mt-2"
              >
                Show all templates
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}