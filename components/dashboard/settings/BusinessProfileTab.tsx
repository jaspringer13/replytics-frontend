"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';
import { BusinessProfile } from '@/app/models/dashboard';

export function BusinessProfileTab() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBusinessProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load business profile:', error);
      toast.error('Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    // Basic validation
    if (!profile.name?.trim()) {
      toast.error('Business name is required');
      return;
    }
    
    if (profile.email && !isValidEmail(profile.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (profile.website && !isValidUrl(profile.website)) {
      toast.error('Please enter a valid website URL');
      return;
    }

    try {
      setSaving(true);
      await apiClient.updateBusinessProfile(profile);
      toast.success('Business profile updated successfully');
    } catch (error) {
      console.error('Failed to update business profile:', error);
      toast.error('Failed to update business profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Alert>
        <AlertDescription>Failed to load business profile</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-6">Business Information</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-gray-300">Business Name</Label>
            <Input
              id="name"
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="mt-1 bg-gray-700/50 border-gray-600 text-white"
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="mt-1 bg-gray-700/50 border-gray-600 text-white"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="mt-1 bg-gray-700/50 border-gray-600 text-white"
              placeholder="contact@yourbusiness.com"
            />
          </div>

          <div>
            <Label htmlFor="website" className="text-gray-300">Website</Label>
            <Input
              id="website"
              type="url"
              value={profile.website || ''}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              className="mt-1 bg-gray-700/50 border-gray-600 text-white"
              placeholder="https://www.yourbusiness.com"
            />
          </div>

          <div>
            <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
            <Select 
              value={profile.timezone || 'America/New_York'}
              onValueChange={(value) => setProfile({ ...profile, timezone: value })}
            >
              <SelectTrigger className="mt-1 bg-gray-700/50 border-gray-600 text-white">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="text-gray-300">Business Address</Label>
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="street"
              value={profile.address?.street || ''}
              onChange={(e) => setProfile({ 
                ...profile, 
                address: { ...profile.address || {}, street: e.target.value }
              })}
              className="bg-gray-700/50 border-gray-600 text-white"
              placeholder="Street Address"
            />
            <Input
              id="city"
              value={profile.address?.city || ''}
              onChange={(e) => setProfile({ 
                ...profile, 
                address: { ...profile.address || {}, city: e.target.value }
              })}
              className="bg-gray-700/50 border-gray-600 text-white"
              placeholder="City"
            />
            <Input
              id="state"
              value={profile.address?.state || ''}
              onChange={(e) => setProfile({ 
                ...profile, 
                address: { ...profile.address || {}, state: e.target.value }
              })}
              className="bg-gray-700/50 border-gray-600 text-white"
              placeholder="State"
            />
            <Input
              id="zip"
              value={profile.address?.zip || ''}
              onChange={(e) => setProfile({ 
                ...profile, 
                address: { ...profile.address || {}, zip: e.target.value }
              })}
              className="bg-gray-700/50 border-gray-600 text-white"
              placeholder="ZIP Code"
            />
          </div>
        </div>

        <div className="flex justify-end">
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}