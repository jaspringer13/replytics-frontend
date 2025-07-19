"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Mic, Volume2, Brain, Loader2, PlayCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { VoiceSettings, ConversationRules, createVoiceSpeed, createVoicePitch } from '@/app/models/dashboard';

interface VoiceConversationTabProps {
  businessId: string;
}

export function VoiceConversationTab({ businessId }: VoiceConversationTabProps) {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings | null>(null);
  const [conversationRules, setConversationRules] = useState<ConversationRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('voice');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [businessId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [voice, rules] = await Promise.all([
        apiClient.getVoiceSettings(),
        apiClient.getConversationRules()
      ]);
      setVoiceSettings(voice);
      setConversationRules(rules);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load voice settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVoice = async () => {
    if (!voiceSettings) return;

    try {
      setSaving(true);
      await apiClient.updateVoiceSettings(voiceSettings);
      toast.success('Voice settings updated successfully');
    } catch (error) {
      console.error('Failed to update voice settings:', error);
      toast.error('Failed to update voice settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRules = async () => {
    if (!conversationRules) return;

    try {
      setSaving(true);
      await apiClient.updateConversationRules(conversationRules);
      toast.success('Conversation rules updated successfully');
    } catch (error) {
      console.error('Failed to update conversation rules:', error);
      toast.error('Failed to update conversation rules');
    } finally {
      setSaving(false);
    }
  };

  const handleVoicePreview = () => {
    toast.info('Voice preview is simulated. Actual voice synthesis requires backend integration.');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Settings
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Conversation Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice">
          {voiceSettings && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="voice-id" className="text-gray-300">Voice Selection</Label>
                <Select 
                  value={voiceSettings.voiceId}
                  onValueChange={(value) => setVoiceSettings({ ...voiceSettings, voiceId: value })}
                >
                  <SelectTrigger className="mt-1 bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="rachel">Rachel (Professional Female)</SelectItem>
                    <SelectItem value="drew">Drew (Professional Male)</SelectItem>
                    <SelectItem value="clyde">Clyde (Casual Male)</SelectItem>
                    <SelectItem value="paul">Paul (News Narrator)</SelectItem>
                    <SelectItem value="domi">Domi (Young Female)</SelectItem>
                    <SelectItem value="bella">Bella (Friendly Female)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="speaking-style" className="text-gray-300">Speaking Style</Label>
                <Select 
                  value={voiceSettings.speakingStyle}
                  onValueChange={(value: any) => setVoiceSettings({ ...voiceSettings, speakingStyle: value })}
                >
                  <SelectTrigger className="mt-1 bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Select speaking style" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="friendly_professional">Friendly Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-gray-300">Speed</Label>
                  <span className="text-sm text-gray-400">{voiceSettings.speed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[voiceSettings.speed]}
                  onValueChange={([value]) => {
                    try {
                      const speed = createVoiceSpeed(value);
                      setVoiceSettings({ ...voiceSettings, speed });
                    } catch (error) {
                      toast.error('Speed must be between 0.5 and 2.0');
                    }
                  }}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-gray-300">Pitch</Label>
                  <span className="text-sm text-gray-400">{voiceSettings.pitch.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[voiceSettings.pitch]}
                  onValueChange={([value]) => {
                    try {
                      const pitch = createVoicePitch(value);
                      setVoiceSettings({ ...voiceSettings, pitch });
                    } catch (error) {
                      toast.error('Pitch must be between 0.5 and 2.0');
                    }
                  }}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  onClick={handleVoicePreview}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Preview Voice
                </Button>

                <Button
                  onClick={handleSaveVoice}
                  disabled={saving}
                  className="bg-brand-500 hover:bg-brand-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Voice Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversation">
          {conversationRules && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Allow Multiple Services</h3>
                    <p className="text-sm text-gray-400">Customers can book multiple services in one call</p>
                  </div>
                  <Switch
                    checked={conversationRules.allowMultipleServices}
                    onCheckedChange={(checked) => 
                      setConversationRules({ ...conversationRules, allowMultipleServices: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Allow Cancellations</h3>
                    <p className="text-sm text-gray-400">Customers can cancel appointments via phone</p>
                  </div>
                  <Switch
                    checked={conversationRules.allowCancellations}
                    onCheckedChange={(checked) => 
                      setConversationRules({ ...conversationRules, allowCancellations: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Allow Rescheduling</h3>
                    <p className="text-sm text-gray-400">Customers can reschedule appointments via phone</p>
                  </div>
                  <Switch
                    checked={conversationRules.allowRescheduling}
                    onCheckedChange={(checked) => 
                      setConversationRules({ ...conversationRules, allowRescheduling: checked })
                    }
                  />
                </div>

                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-white">No-Show Blocking</h3>
                      <p className="text-sm text-gray-400">Block customers after repeated no-shows</p>
                    </div>
                    <Switch
                      checked={conversationRules.noShowBlockEnabled}
                      onCheckedChange={(checked) => 
                        setConversationRules({ ...conversationRules, noShowBlockEnabled: checked })
                      }
                    />
                  </div>
                  
                  {conversationRules.noShowBlockEnabled && (
                    <div>
                      <Label className="text-gray-300">No-shows before blocking</Label>
                      <Select 
                        value={conversationRules.noShowThreshold.toString()}
                        onValueChange={(value) => 
                          setConversationRules({ ...conversationRules, noShowThreshold: parseInt(value) })
                        }
                      >
                        <SelectTrigger className="mt-1 bg-gray-600/50 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="2">2 no-shows</SelectItem>
                          <SelectItem value="3">3 no-shows</SelectItem>
                          <SelectItem value="4">4 no-shows</SelectItem>
                          <SelectItem value="5">5 no-shows</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveRules}
                  disabled={saving}
                  className="bg-brand-500 hover:bg-brand-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Conversation Rules
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}