/**
 * Phone Number Model
 * Each business can have multiple phone numbers (locations)
 * Settings are scoped to individual phone numbers
 */

import { 
  VoiceSettings, 
  ConversationRules, 
  OperatingHours,
  ValidTimezone 
} from './dashboard';

export interface PhoneNumber {
  id: string;
  businessId: string;
  phoneNumber: string;
  displayName: string; // e.g., "Downtown Location", "Airport Branch"
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  timezone: ValidTimezone;
  isActive: boolean;
  isPrimary: boolean; // One number should be marked as primary
  
  // Phone-specific settings
  voiceSettings: VoiceSettings;
  conversationRules: ConversationRules;
  smsSettings?: {
    enabled: boolean;
    remindersEnabled: boolean;
    reminderHours: number;
  };
  
  // Phone-specific operating hours
  operatingHours?: OperatingHours[];
  
  // Staff assignment (staff IDs who work at this location)
  assignedStaffIds?: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface PhoneNumberCreate {
  phoneNumber: string;
  displayName: string;
  description?: string;
  address?: PhoneNumber['address'];
  timezone: ValidTimezone;
  isActive?: boolean;
  isPrimary?: boolean;
  voiceSettings?: Partial<VoiceSettings>;
  conversationRules?: Partial<ConversationRules>;
}

export interface PhoneNumberUpdate {
  displayName?: string;
  description?: string;
  address?: PhoneNumber['address'];
  timezone?: ValidTimezone;
  isActive?: boolean;
  isPrimary?: boolean;
  voiceSettings?: Partial<VoiceSettings>;
  conversationRules?: Partial<ConversationRules>;
  smsSettings?: PhoneNumber['smsSettings'];
  assignedStaffIds?: string[];
}

// Extended Business Profile to include phone numbers
export interface BusinessWithPhoneNumbers {
  id: string;
  name: string;
  email: string;
  website?: string;
  industry?: string;
  
  // Phone numbers associated with this business
  phoneNumbers: PhoneNumber[];
  
  // Business-level settings (apply to all locations)
  defaultVoiceSettings?: VoiceSettings;
  defaultConversationRules?: ConversationRules;
  billingSettings?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    plan?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Helper type for phone number selection
export interface PhoneNumberOption {
  id: string;
  phoneNumber: string;
  displayName: string;
  isPrimary: boolean;
  isActive: boolean;
}