"use client"

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/contexts/SettingsContext';
import { BusinessProfile } from '@/lib/hooks/useSettingsData';

// Validation utilities
const validators = {
  email: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  phone: (phone: string): boolean => {
    // Basic phone validation - can be enhanced based on requirements
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
};

interface ValidationErrors {
  name?: string;
  email?: string;
  website?: string;
  phone?: string;
}

interface ExtendedBusinessProfile extends Omit<BusinessProfile, 'timezone' | 'voiceSettings' | 'conversationRules' | 'smsSettings' | 'createdAt' | 'updatedAt'> {
  website?: string;
  timezone?: string; // Allow any string in form, convert to ValidTimezone on save
  industry?: string;
  addressString?: string;
}

export function BusinessProfileTab() {
  const { settingsData } = useSettings();
  const { data, updateProfile } = settingsData;
  const { profile } = data;
  
  const [formData, setFormData] = useState<Partial<ExtendedBusinessProfile>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile && Object.keys(formData).length === 0) {
      const { voiceSettings, conversationRules, smsSettings, createdAt, updatedAt, ...profileData } = profile;
      setFormData({
        ...profileData,
        timezone: profileData.timezone as string,
        addressString: profile.address ? 
          `${profile.address.street || ''} ${profile.address.city || ''} ${profile.address.state || ''} ${profile.address.zip || ''}`.trim() : 
          ''
      });
    }
  }, [profile, formData]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Business name is required';
    }
    
    if (formData.email && !validators.email(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.website && !validators.url(formData.website)) {
      newErrors.website = 'Please enter a valid URL (e.g., https://example.com)';
    }
    
    if (formData.phone && !validators.phone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    try {
      setSaving(true);
      // Convert addressString back to address object
      const profileUpdate: any = {
        id: formData.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        timezone: formData.timezone,
        industry: formData.industry,
      };
      
      // Only include address if addressString has content
      if (formData.addressString?.trim()) {
        // Parse the address string more comprehensively
        const addressParts = formData.addressString.trim().split(',').map(s => s.trim());
        profileUpdate.address = {
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          state: addressParts[2] || '',
          zip: addressParts[3] || '',
        };
      }
      
      await updateProfile(profileUpdate);
      toast.success('Business profile updated successfully');
    } catch (error) {
      console.error('Failed to update business profile:', error);
      toast.error('Failed to update business profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No business profile found</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Business Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your Business Name"
              className={`bg-gray-700/50 ${errors.name ? 'border-red-500' : ''}`}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Business Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contact@business.com"
              className={`bg-gray-700/50 ${errors.email ? 'border-red-500' : ''}`}
              required
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={`bg-gray-700/50 ${errors.phone ? 'border-red-500' : ''}`}
              required
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.yourbusiness.com"
              className={`bg-gray-700/50 ${errors.website ? 'border-red-500' : ''}`}
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              value={formData.addressString || ''}
              onChange={(e) => handleChange('addressString', e.target.value)}
              placeholder="123 Main St, City, State ZIP"
              className="bg-gray-700/50"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={formData.timezone || 'America/New_York'}
              onValueChange={(value) => handleChange('timezone', value)}
            >
              <SelectTrigger id="timezone" className="bg-gray-700/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select 
              value={formData.industry || ''}
              onValueChange={(value) => handleChange('industry', value)}
            >
              <SelectTrigger id="industry" className="bg-gray-700/50">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="professional">Professional Services</SelectItem>
                <SelectItem value="home_services">Home Services</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
}