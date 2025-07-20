'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Settings, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { VOICE_OPTIONS } from '@/config/voice-options';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/api-client';
import { ValidTimezone } from '@/app/models/dashboard';
import { PhoneNumber } from '@/app/models/phone-number';

interface PhoneOnboardingWizardProps {
  businessId: string;
  onComplete: (phone: PhoneNumber) => void;
  onCancel: () => void;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  postalCode: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  monthlyPrice: number;
}

interface OnboardingData {
  // Step 1: Search
  areaCode: string;
  selectedNumber: AvailableNumber | null;
  
  // Step 2: Configure
  displayName: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Step 3: Settings
  timezone: ValidTimezone;
  voiceId: string;
  smsEnabled: boolean;
  reminderHours: number;
}

const STEPS = [
  { id: 'search', title: 'Find Number', icon: Phone },
  { id: 'configure', title: 'Configure', icon: MapPin },
  { id: 'settings', title: 'Settings', icon: Settings },
  { id: 'review', title: 'Review', icon: Check }
];


const TIMEZONE_OPTIONS: ValidTimezone[] = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu'
];

export function PhoneOnboardingWizard({ 
  businessId, 
  onComplete, 
  onCancel 
}: PhoneOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    areaCode: '',
    selectedNumber: null,
    displayName: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    timezone: 'America/New_York',
    voiceId: 'kdmDKE6EkgrWrrykO9Qt',
    smsEnabled: true,
    reminderHours: 24
  });
  
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  
  const { toast } = useToast();

  // Step 1: Search for available numbers
  const searchNumbers = useCallback(async () => {
    if (!data.areaCode || !/^\d{3}$/.test(data.areaCode)) {
      setSearchError('Please enter a valid 3-digit area code (numbers only)');
      return;
    }
    
    setLoading(true);
    setSearchError(null);
    
    try {
      const results = await apiClient.searchAvailablePhoneNumbers({
        areaCode: data.areaCode
      });
      
      // Transform API response to match component interface
      const transformedResults = results.map(number => ({
        phoneNumber: number.phone_number,
        friendlyName: number.friendly_name,
        locality: number.locality,
        region: number.region,
        postalCode: number.postal_code,
        capabilities: number.capabilities,
        monthlyPrice: number.monthlyPrice || 1.00
      }));
      
      setAvailableNumbers(transformedResults);
      
      if (results.length === 0) {
        setSearchError(`No numbers available in area code ${data.areaCode}`);
      }
    } catch (error) {
      console.error('Failed to search numbers:', error);
      setSearchError('Failed to search for available numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [data.areaCode]);

  // Validate current step before proceeding
  const validateStep = useCallback(() => {
    switch (currentStep) {
      case 0: // Search
        if (!data.selectedNumber) {
          toast.error('Please select a phone number');
          return false;
        }
        return true;
        
      case 1: // Configure
        if (!data.displayName.trim()) {
          toast.error('Please enter a display name');
          return false;
        }
        if (!data.address.street || !data.address.city || 
            !data.address.state || !data.address.zip) {
          toast.error('Please complete the address information');
          return false;
        }
        return true;
        
      case 2: // Settings
        return true; // All settings have defaults
        
      default:
        return true;
    }
  }, [currentStep, data, toast]);

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  }, [validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // Extract area code from phone number with validation
  const extractAreaCode = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.slice(1, 4);
    } else if (cleaned.length === 10) {
      return cleaned.slice(0, 3);
    }
    // Fallback to the search area code
    return data.areaCode;
  };

  // Provision the phone number
  const handleProvision = async () => {
    if (!data.selectedNumber) return;
    
    setProvisioning(true);
    
    try {
      // Step 1: Provision the number
      const phone = await apiClient.provisionPhoneNumber({
        displayName: data.displayName,
        areaCode: extractAreaCode(data.selectedNumber.phoneNumber),
        timezone: data.timezone,
        description: data.description
      });
      
      // Step 2: Configure initial settings
      await Promise.all([
        // Voice settings
        apiClient.updatePhoneVoiceSettings(phone.id, {
          voiceId: data.voiceId
        }),
        
        // SMS settings
        apiClient.updatePhoneSmsSettings(phone.id, {
          enabled: data.smsEnabled,
          reminderHours: data.reminderHours
        }),
        
        // Default operating hours (9-5 weekdays)
        apiClient.updatePhoneOperatingHours(phone.id, {
          operatingHours: [
            { day: 'Monday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
            { day: 'Tuesday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
            { day: 'Wednesday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
            { day: 'Thursday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
            { day: 'Friday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
            { day: 'Saturday', enabled: false, hours: [] },
            { day: 'Sunday', enabled: false, hours: [] }
          ],
          timezone: data.timezone
        })
      ]);
      
      toast.success('Phone number provisioned successfully!');
      onComplete(phone);
      
    } catch (error) {
      console.error('Failed to provision phone:', error);
      toast.error('Failed to provision phone number. Please try again.');
    } finally {
      setProvisioning(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Search
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Find Your Business Phone Number
              </h3>
              <p className="text-gray-400">
                Search for available phone numbers by area code
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="areaCode">Area Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="areaCode"
                    type="text"
                    placeholder="212"
                    maxLength={3}
                    value={data.areaCode}
                    onChange={(e) => setData({ ...data, areaCode: e.target.value })}
                    className="w-24"
                  />
                  <Button
                    onClick={searchNumbers}
                    disabled={loading || data.areaCode.length !== 3}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>
              
              {searchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}
              
              {availableNumbers.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Numbers</Label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {availableNumbers.map((number) => (
                      <Card
                        key={number.phoneNumber}
                        className={cn(
                          "p-3 cursor-pointer transition-all",
                          data.selectedNumber?.phoneNumber === number.phoneNumber
                            ? "border-brand-500 bg-brand-500/10"
                            : "hover:border-gray-600"
                        )}
                        onClick={() => setData({ ...data, selectedNumber: number })}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {number.friendlyName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {number.locality}, {number.region} {number.postalCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">
                              ${number.monthlyPrice}/mo
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 1: // Configure
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Configure Your Phone Number
              </h3>
              <p className="text-gray-400">
                Set up basic information for {data.selectedNumber?.friendlyName}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Main Office"
                  value={data.displayName}
                  onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Customer service and appointments"
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-4">
                <Label>Business Address</Label>
                <Input
                  placeholder="Street Address"
                  value={data.address.street}
                  onChange={(e) => setData({
                    ...data,
                    address: { ...data.address, street: e.target.value }
                  })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="City"
                    value={data.address.city}
                    onChange={(e) => setData({
                      ...data,
                      address: { ...data.address, city: e.target.value }
                    })}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="State"
                      maxLength={2}
                      value={data.address.state}
                      onChange={(e) => setData({
                        ...data,
                        address: { ...data.address, state: e.target.value.toUpperCase() }
                      })}
                      className="w-20"
                    />
                    <Input
                      placeholder="ZIP"
                      value={data.address.zip}
                      onChange={(e) => setData({
                        ...data,
                        address: { ...data.address, zip: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2: // Settings
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Configure Settings
              </h3>
              <p className="text-gray-400">
                Set up voice, SMS, and timezone preferences
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={data.timezone}
                  onChange={(e) => setData({ ...data, timezone: e.target.value as ValidTimezone })}
                  className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-brand-500"
                >
                  {TIMEZONE_OPTIONS.map(tz => (
                    <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Voice Selection</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(VOICE_OPTIONS).map(([id, name]) => (
                    <label
                      key={id}
                      className={cn(
                        "flex items-center p-3 rounded-lg border cursor-pointer transition-all",
                        data.voiceId === id
                          ? "border-brand-500 bg-brand-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      )}
                    >
                      <input
                        type="radio"
                        name="voice"
                        value={id}
                        checked={data.voiceId === id}
                        onChange={(e) => setData({ ...data, voiceId: e.target.value })}
                        className="sr-only"
                      />
                      <span className="text-white">{name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>SMS Settings</Label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={data.smsEnabled}
                    onChange={(e) => setData({ ...data, smsEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-white">Enable SMS messaging</span>
                </label>
                
                {data.smsEnabled && (
                  <div className="pl-7">
                    <Label htmlFor="reminderHours" className="text-sm">
                      Send reminders before appointments
                    </Label>
                    <select
                      id="reminderHours"
                      value={data.reminderHours}
                      onChange={(e) => setData({ ...data, reminderHours: parseInt(e.target.value) })}
                      className="mt-1 w-32 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={48}>48 hours</option>
                      <option value={72}>72 hours</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 3: // Review
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Review & Confirm
              </h3>
              <p className="text-gray-400">
                Please review your configuration before provisioning
              </p>
            </div>
            
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium text-white mb-3">Phone Number</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Number:</span>
                    <span className="text-white">{data.selectedNumber?.friendlyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">
                      {data.selectedNumber?.locality}, {data.selectedNumber?.region}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Cost:</span>
                    <span className="text-white">${data.selectedNumber?.monthlyPrice}/mo</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium text-white mb-3">Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Display Name:</span>
                    <span className="text-white">{data.displayName}</span>
                  </div>
                  {data.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Description:</span>
                      <span className="text-white">{data.description}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-white text-right">
                      {data.address.street}<br />
                      {data.address.city}, {data.address.state} {data.address.zip}
                    </span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium text-white mb-3">Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timezone:</span>
                    <span className="text-white">{data.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Voice:</span>
                    <span className="text-white">{VOICE_OPTIONS[data.voiceId]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SMS:</span>
                    <span className="text-white">
                      {data.smsEnabled ? `Enabled (${data.reminderHours}h reminders)` : 'Disabled'}
                    </span>
                  </div>
                </div>
              </Card>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By confirming, you agree to provision this phone number for ${data.selectedNumber?.monthlyPrice}/month.
                  You can configure additional settings after provisioning.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                  isActive ? "bg-brand-500 text-white" : 
                  isCompleted ? "bg-green-500 text-white" : 
                  "bg-gray-700 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-2 transition-all",
                    isCompleted ? "bg-green-500" : "bg-gray-700"
                  )}
                />
              )}
              
              <span className={cn(
                "ml-2 text-sm hidden md:inline",
                isActive ? "text-white" : "text-gray-400"
              )}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={provisioning}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 0 && !data.selectedNumber}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleProvision}
              disabled={provisioning}
              variant="default"
            >
              {provisioning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm & Provision
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}