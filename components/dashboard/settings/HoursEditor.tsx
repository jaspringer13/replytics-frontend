"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Clock, Calendar, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { OperatingHours, DayOfWeek } from '@/app/models/dashboard';

interface HoursEditorProps {
  businessId: string;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function HoursEditor({ businessId }: HoursEditorProps) {
  const [hours, setHours] = useState<OperatingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadHours();
  }, [businessId]);

  const loadHours = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBusinessHours();
      setHours(data.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    } catch (error) {
      console.error('Failed to load business hours:', error);
      toast.error('Failed to load business hours');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.updateBusinessHours(hours);
      toast.success('Business hours updated successfully');
    } catch (error) {
      console.error('Failed to update business hours:', error);
      toast.error('Failed to update business hours');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (dayOfWeek: DayOfWeek, updates: Partial<OperatingHours>) => {
    setHours(hours.map(h => 
      h.dayOfWeek === dayOfWeek ? { ...h, ...updates } : h
    ));
  };

  const applyToAllDays = (sourceDay: OperatingHours) => {
    setHours(hours.map(h => ({
      ...h,
      openTime: sourceDay.openTime,
      closeTime: sourceDay.closeTime,
      isClosed: sourceDay.isClosed
    })));
  };

  const setStandardHours = () => {
    setHours(hours.map(h => ({
      ...h,
      openTime: h.dayOfWeek === 0 || h.dayOfWeek === 6 ? '10:00' : '09:00',
      closeTime: h.dayOfWeek === 0 || h.dayOfWeek === 6 ? '18:00' : '20:00',
      isClosed: false
    })));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Operating Hours</h2>
        <div className="flex gap-2">
          <Button 
            onClick={setStandardHours}
            variant="outline"
            size="sm"
            className="text-gray-300 border-gray-600"
          >
            Set Standard Hours
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {hours.map((day) => (
          <div 
            key={day.dayOfWeek} 
            className={`p-4 rounded-lg border ${
              day.isClosed ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-700/30 border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-32">
                  <span className="font-medium text-white">{dayNames[day.dayOfWeek]}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={!day.isClosed}
                    onCheckedChange={(checked) => updateDay(day.dayOfWeek, { isClosed: !checked })}
                  />
                  <Label className="text-gray-300">
                    {day.isClosed ? 'Closed' : 'Open'}
                  </Label>
                </div>

                {!day.isClosed && (
                  <div className="flex items-center gap-2 ml-4">
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={(e) => updateDay(day.dayOfWeek, { openTime: e.target.value })}
                      onBlur={(e) => {
                        if (day.closeTime && e.target.value >= day.closeTime) {
                          toast.error('Opening time must be before closing time');
                        }
                      }}
                      className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => updateDay(day.dayOfWeek, { closeTime: e.target.value })}
                      onBlur={(e) => {
                        if (day.openTime && day.openTime >= e.target.value) {
                          toast.error('Closing time must be after opening time');
                        }
                      }}
                      className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                )}
              </div>

              {!day.isClosed && (
                <Button
                  onClick={() => applyToAllDays(day)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  Apply to all
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <div className="flex items-start gap-2">
          <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-white mb-1">Holiday Management</h3>
            <p className="text-sm text-gray-400">
              Holiday and special hours management is coming soon. You'll be able to set custom hours 
              for holidays and special events.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Hours
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}