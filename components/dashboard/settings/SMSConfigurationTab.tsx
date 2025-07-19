"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, MessageSquare, Bell, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

interface SMSConfigurationTabProps {
  businessId?: string; // Currently unused - API uses auth context
}

interface SMSSettings {
  enabled: boolean;
  remindersEnabled: boolean;
  reminderHours: number;
  notifyOwnerBooking: boolean;
  notifyOwnerCancellation: boolean;
}

interface SMSTemplate {
  id: string;
  templateType: string;
  template: string;
  variables: string[];
}

export function SMSConfigurationTab({ businessId }: SMSConfigurationTabProps) {
  const [smsSettings, setSmsSettings] = useState<SMSSettings | null>(null);
  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const { toast } = useToast();

  useEffect(() => {
    loadSMSData();
  }, []);

  const loadSMSData = async () => {
    try {
      setLoading(true);
      const [settings, templates] = await Promise.all([
        apiClient.getSMSSettings(),
        apiClient.getSMSTemplates()
      ]);
      setSmsSettings(settings as SMSSettings);
      setSmsTemplates(templates as SMSTemplate[]);
    } catch (error) {
      console.error('Failed to load SMS data:', error);
      toast.error('Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!smsSettings) return;

    try {
      setSaving(true);
      await apiClient.updateSMSSettings(smsSettings);
      toast.success('SMS settings updated successfully');
    } catch (error) {
      console.error('Failed to update SMS settings:', error);
      toast.error('Failed to update SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemplate = async (templateId: string, template: string) => {
    try {
      await apiClient.updateSMSTemplate(templateId, { template });
      toast.success('Template updated successfully');
      loadSMSData();
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    }
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
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Message Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          {smsSettings && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">Enable SMS</h3>
                  <p className="text-sm text-gray-400">Send and receive SMS messages</p>
                </div>
                <Switch
                  checked={smsSettings.enabled}
                  onCheckedChange={(checked) => 
                    setSmsSettings({ ...smsSettings, enabled: checked })
                  }
                />
              </div>

              {smsSettings.enabled && (
                <>
                  <div className="p-4 bg-gray-700/30 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">Appointment Reminders</h3>
                        <p className="text-sm text-gray-400">Send automatic reminders before appointments</p>
                      </div>
                      <Switch
                        checked={smsSettings.remindersEnabled}
                        onCheckedChange={(checked) => 
                          setSmsSettings({ ...smsSettings, remindersEnabled: checked })
                        }
                      />
                    </div>

                    {smsSettings.remindersEnabled && (
                      <div>
                        <Label className="text-gray-300">Send reminder</Label>
                        <Select 
                          value={smsSettings.reminderHours.toString()}
                          onValueChange={(value) => 
                            setSmsSettings({ ...smsSettings, reminderHours: parseInt(value) })
                          }
                        >
                          <SelectTrigger className="mt-1 bg-gray-600/50 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="2">2 hours before</SelectItem>
                            <SelectItem value="4">4 hours before</SelectItem>
                            <SelectItem value="12">12 hours before</SelectItem>
                            <SelectItem value="24">24 hours before</SelectItem>
                            <SelectItem value="48">48 hours before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-white">Owner Notifications</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <h4 className="text-white">New Booking Notifications</h4>
                        <p className="text-sm text-gray-400">Get notified when customers book appointments</p>
                      </div>
                      <Switch
                        checked={smsSettings.notifyOwnerBooking}
                        onCheckedChange={(checked) => 
                          setSmsSettings({ ...smsSettings, notifyOwnerBooking: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <h4 className="text-white">Cancellation Notifications</h4>
                        <p className="text-sm text-gray-400">Get notified when appointments are cancelled</p>
                      </div>
                      <Switch
                        checked={smsSettings.notifyOwnerCancellation}
                        onCheckedChange={(checked) => 
                          setSmsSettings({ ...smsSettings, notifyOwnerCancellation: checked })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
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
                      Save SMS Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-4">
            {smsTemplates.map((template) => (
              <div key={template.id} className="p-4 bg-gray-700/30 rounded-lg">
                <h3 className="font-medium text-white mb-2 capitalize">
                  {template.templateType.replace(/_/g, ' ')}
                </h3>
                <Textarea
                  value={template.template}
                  onChange={(e) => {
                    const updatedTemplates = smsTemplates.map(t =>
                      t.id === template.id ? { ...t, template: e.target.value } : t
                    );
                    setSmsTemplates(updatedTemplates);
                  }}
                  onBlur={() => handleUpdateTemplate(template.id, template.template)}
                  className="mt-1 bg-gray-700/50 border-gray-600 text-white"
                  rows={3}
                />
                {template.variables.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Available variables: {template.variables.map(v => `{${v}}`).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}