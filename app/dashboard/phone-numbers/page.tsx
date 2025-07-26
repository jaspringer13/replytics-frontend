'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Phone, Plus, Settings, Trash2, Check, X } from 'lucide-react';
import { PhoneNumber } from '@/app/models/phone-number';
import { VoiceSettingsService } from '@/app/services/dashboard/voice_settings_service';
import { VOICE_OPTIONS } from '@/config/voice-options';
import { formatPhoneNumber } from '@/lib/utils';

export default function PhoneNumbersPage() {
  const router = useRouter();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    description: ''
  });
  const { toast } = useToast();

  // Fetch phone numbers
  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      const response = await fetch('/api/v2/dashboard/phone-numbers');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch phone numbers: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      setPhoneNumbers(data);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers', 
        error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (phoneId: string) => {
    try {
      const response = await fetch(`/api/v2/dashboard/phone-numbers/${phoneId}/set-primary`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to set primary phone');
      
      toast.success('Primary phone number updated');
      await fetchPhoneNumbers();
    } catch (error) {
      console.error('Error setting primary phone:', error);
      toast.error('Failed to set primary phone number');
    }
  };

  const handleEdit = (phone: PhoneNumber) => {
    setEditingId(phone.id);
    setEditForm({
      displayName: phone.displayName || '',
      description: phone.description || ''
    });
  };

  const handleSaveEdit = async (phoneId: string) => {
    try {
      const response = await fetch(`/api/v2/dashboard/phone-numbers/${phoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) throw new Error('Failed to update phone');
      
      toast.success('Phone number updated');
      setEditingId(null);
      await fetchPhoneNumbers();
    } catch (error) {
      console.error('Error updating phone:', error);
      toast.error('Failed to update phone number');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ displayName: '', description: '' });
  };

  const handleToggleActive = async (phoneId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/v2/dashboard/phone-numbers/${phoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      
      if (!response.ok) throw new Error('Failed to toggle phone status');
      
      toast.success(`Phone number ${!currentActive ? 'activated' : 'suspended'}`);
      await fetchPhoneNumbers();
    } catch (error) {
      console.error('Error toggling phone status:', error);
      toast.error('Failed to update phone status');
    }
  };


  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Phone Numbers</h1>
          <p className="text-gray-400">
            Manage your business phone numbers and their settings
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {phoneNumbers.length} phone number{phoneNumbers.length !== 1 ? 's' : ''} configured
          </div>
          <Button variant="default" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Add Phone Number
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {phoneNumbers.map(phone => (
              <Card key={phone.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-5 h-5 text-brand-500" />
                      <h3 className="text-xl font-semibold text-white">
                        {formatPhoneNumber(phone.phoneNumber)}
                      </h3>
                      {phone.isPrimary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                      <Badge variant={phone.isActive ? 'default' : 'secondary'}>
                        {phone.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </div>
                    
                    {editingId === phone.id ? (
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                            placeholder="e.g., Main Office"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="e.g., Customer service line"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSaveEdit(phone.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {phone.displayName && (
                          <h4 className="text-lg text-white mb-1">{phone.displayName}</h4>
                        )}
                        {phone.description && (
                          <p className="text-gray-400">{phone.description}</p>
                        )}
                        {phone.address && typeof phone.address === 'string' && (
                          <p className="text-sm text-gray-500 mt-2">{phone.address}</p>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!phone.isPrimary && phone.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(phone.id)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    
                    {editingId !== phone.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(phone)}
                        >
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(phone.id, phone.isActive)}
                        >
                          {phone.isActive ? 'Suspend' : 'Activate'}
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/settings?phone=${phone.id}`)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Voice</p>
                    <p className="text-white">
                      {phone.voiceSettings?.voiceId && phone.voiceSettings.voiceId in VOICE_OPTIONS 
                        ? VOICE_OPTIONS[phone.voiceSettings.voiceId] 
                        : 'Custom'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">SMS</p>
                    <p className="text-white">
                      {phone.smsSettings?.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Timezone</p>
                    <p className="text-white">{phone.timezone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Staff Assigned</p>
                    <p className="text-white">
                      {phone.assignedStaffIds?.length || 0} members
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}