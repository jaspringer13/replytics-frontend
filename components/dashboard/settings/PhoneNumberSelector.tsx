'use client';

import { useState } from 'react';
import { Phone, ChevronDown, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { PhoneNumber, PhoneNumberOption } from '@/app/models/phone-number';

interface PhoneNumberSelectorProps {
  phoneNumbers: PhoneNumberOption[];
  selectedPhoneId: string | null;
  onPhoneSelect: (phoneId: string) => void;
  onAddPhone?: () => void;
  loading?: boolean;
  className?: string;
}

export function PhoneNumberSelector({
  phoneNumbers,
  selectedPhoneId,
  onPhoneSelect,
  onAddPhone,
  loading = false,
  className
}: PhoneNumberSelectorProps) {
  const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId);
  
  if (!selectedPhone && phoneNumbers.length > 0) {
    // Auto-select primary or first active phone
    const primaryPhone = phoneNumbers.find(p => p.isPrimary);
    const firstActive = phoneNumbers.find(p => p.isActive);
    const autoSelect = primaryPhone || firstActive || phoneNumbers[0];
    if (autoSelect) {
      onPhoneSelect(autoSelect.id);
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (e.g., +1 (256) 809-0055)
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            disabled={loading || phoneNumbers.length === 0}
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {selectedPhone ? (
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedPhone.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPhoneNumber(selectedPhone.phoneNumber)}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Select a phone number</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedPhone?.isPrimary && (
                <Badge variant="secondary" className="text-xs">Primary</Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-[300px]">
          <DropdownMenuLabel>Phone Numbers</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {phoneNumbers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No phone numbers configured
            </div>
          ) : (
            <>
              {phoneNumbers.map((phone) => (
                <DropdownMenuItem
                  key={phone.id}
                  onClick={() => onPhoneSelect(phone.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {phone.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{phone.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatPhoneNumber(phone.phoneNumber)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {phone.isPrimary && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                      {phone.id === selectedPhoneId && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {onAddPhone && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddPhone} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add New Phone Number
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {phoneNumbers.length === 0 && onAddPhone && (
        <Button onClick={onAddPhone} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Phone Number
        </Button>
      )}
    </div>
  );
}