"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, MapPin, Clock, Plus } from 'lucide-react';
import { PhoneNumberCreate } from '@/app/models/phone-number';
import { ValidTimezone } from '@/app/models/dashboard';

interface AddPhoneNumberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (phoneData: PhoneNumberCreate) => Promise<void>;
}

const TIMEZONES: { value: ValidTimezone; label: string }[] = [
  { value: 'America/New_York' as ValidTimezone, label: 'Eastern Time (ET)' },
  { value: 'America/Chicago' as ValidTimezone, label: 'Central Time (CT)' },
  { value: 'America/Denver' as ValidTimezone, label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles' as ValidTimezone, label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix' as ValidTimezone, label: 'Arizona Time' },
  { value: 'Pacific/Honolulu' as ValidTimezone, label: 'Hawaii Time' },
];

export function AddPhoneNumberDialog({ isOpen, onClose, onAdd }: AddPhoneNumberDialogProps) {
  const [formData, setFormData] = useState<Partial<PhoneNumberCreate>>({
    phoneNumber: '',
    displayName: '',
    description: '',
    timezone: 'America/New_York' as ValidTimezone,
    isActive: true,
    isPrimary: false,
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate phone number
    const cleanPhone = formData.phoneNumber?.replace(/\D/g, '') || '';
    if (!cleanPhone) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      newErrors.phoneNumber = 'Phone number must be 10 or 11 digits';
    }
    
    // Validate display name
    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Location name is required';
    }
    
    // Validate timezone
    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      await onAdd(formData as PhoneNumberCreate);
      // Reset form
      setFormData({
        phoneNumber: '',
        displayName: '',
        description: '',
        timezone: 'America/New_York' as ValidTimezone,
        isActive: true,
        isPrimary: false,
        address: {
          street: '',
          city: '',
          state: '',
          zip: '',
        },
      });
      onClose();
    } catch (error) {
      // Error handling is done in the parent
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Add New Phone Number
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Location Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="Downtown Location"
                  value={formData.displayName}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className={errors.displayName ? 'border-red-500' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-500">{errors.displayName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Main downtown location, handles walk-ins..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Location Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Details
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={formData.address?.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.address?.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    maxLength={2}
                    value={formData.address?.state}
                    onChange={(e) => handleAddressChange('state', e.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    placeholder="10001"
                    maxLength={10}
                    value={formData.address?.zip}
                    onChange={(e) => handleAddressChange('zip', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Settings
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  Timezone <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value: ValidTimezone) => handleChange('timezone', value)}
                >
                  <SelectTrigger id="timezone" className={errors.timezone ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timezone && (
                  <p className="text-sm text-red-500">{errors.timezone}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-gray-400">
                    Phone number can receive calls
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isPrimary">Set as Primary</Label>
                  <p className="text-sm text-gray-400">
                    Default phone number for the business
                  </p>
                </div>
                <Switch
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onCheckedChange={(checked) => handleChange('isPrimary', checked)}
                />
              </div>
            </div>
          </div>

          <Alert className="bg-blue-900/20 border-blue-700">
            <AlertDescription>
              After adding this phone number, you can configure its specific voice settings, 
              operating hours, and conversation rules.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Phone Number
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}