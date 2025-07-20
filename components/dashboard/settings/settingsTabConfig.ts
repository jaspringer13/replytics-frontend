import { 
  Building2, 
  Calendar, 
  MessageSquare, 
  Phone, 
  Wrench, 
  Puzzle, 
  Users 
} from 'lucide-react';
import type { SettingsTab } from '@/contexts/SettingsContext';

export const SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'business-profile',
    label: 'Business Profile',
    icon: Building2,
    shortLabel: 'Profile',
  },
  {
    id: 'services',
    label: 'Services',
    icon: Wrench,
  },
  {
    id: 'hours',
    label: 'Hours',
    icon: Calendar,
  },
  {
    id: 'voice-conversation',
    label: 'Voice & Conversation',
    icon: Phone,
    shortLabel: 'Voice',
  },
  {
    id: 'sms',
    label: 'SMS Settings',
    icon: MessageSquare,
    shortLabel: 'SMS',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Puzzle,
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: Users,
  },
];