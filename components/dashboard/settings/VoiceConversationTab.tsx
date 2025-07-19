"use client"

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings, Mic, Volume2, Clock } from 'lucide-react';

interface VoiceConversationTabProps {}

export function VoiceConversationTab({}: VoiceConversationTabProps) {
  return (
    <Card className="p-8 bg-gray-800/50 border-gray-700">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Voice & Conversation Settings
          </h2>
          <p className="text-gray-400 text-lg">
            Coming Soon
          </p>
        </div>

        {/* Features Preview */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 text-gray-300 bg-gray-700/30 p-3 rounded-lg">
            <Mic className="w-5 h-5 text-brand-400" />
            <span>Custom voice selection & tuning</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-300 bg-gray-700/30 p-3 rounded-lg">
            <Volume2 className="w-5 h-5 text-brand-400" />
            <span>Speaking style & personality</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-300 bg-gray-700/30 p-3 rounded-lg">
            <Clock className="w-5 h-5 text-brand-400" />
            <span>Conversation flow rules</span>
          </div>
        </div>

        {/* Description */}
        <div className="max-w-lg mx-auto">
          <p className="text-gray-400">
            Customize your AI assistant's voice, personality, and conversation rules. 
            This feature is currently in development and will be available soon.
          </p>
        </div>

        {/* CTA */}
        <div>
          <Button 
            variant="outline" 
            disabled
            className="bg-gray-700/50 border-gray-600 text-gray-400"
          >
            Available Soon
          </Button>
        </div>
      </div>
    </Card>
  );
}