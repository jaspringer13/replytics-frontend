/**
 * Customer Memory System
 * Extracted from admin CallerMemory component - tracks individual customer history
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Flag,
  TrendingUp,
  AlertCircle 
} from 'lucide-react';

export interface CustomerMemory {
  id: string;
  businessId: string;
  customerId: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  
  // Interaction history
  totalInteractions: number;
  lastInteraction: Date;
  firstInteraction: Date;
  
  // Booking history
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShows: number;
  
  // Preferences and notes
  preferences: {
    preferredServices?: string[];
    preferredStaff?: string[];
    preferredTimes?: string[];
    communicationPreference?: 'phone' | 'sms' | 'email';
  };
  
  // Business-specific data
  lifetimeValue: number;
  averageServiceValue: number;
  customFlags: string[];
  notes?: string;
  
  // Behavior patterns
  bookingPatterns?: {
    typicalDayOfWeek?: string[];
    typicalTimeOfDay?: string;
    advanceBookingDays?: number;
  };
}

interface CustomerMemoryCardProps {
  customer: CustomerMemory;
  onAddNote?: (customerId: string, note: string) => void;
  onAddFlag?: (customerId: string, flag: string) => void;
}

export function CustomerMemoryCard({ customer, onAddNote, onAddFlag }: CustomerMemoryCardProps) {
  const noShowRate = customer.totalBookings > 0 
    ? ((customer.noShows / customer.totalBookings) * 100).toFixed(1)
    : '0';

  const showRate = customer.totalBookings > 0
    ? ((customer.completedBookings / customer.totalBookings) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {customer.firstName?.[0]}{customer.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {customer.firstName} {customer.lastName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {customer.phone}
                {customer.email && (
                  <>
                    <span>•</span>
                    {customer.email}
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {customer.customFlags.map((flag) => (
              <Badge key={flag} variant="secondary">
                <Flag className="h-3 w-3 mr-1" />
                {flag}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-semibold">{customer.totalBookings}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Show Rate</p>
            <p className="text-2xl font-semibold text-green-600">{showRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Lifetime Value</p>
            <p className="text-2xl font-semibold">${customer.lifetimeValue}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Service</p>
            <p className="text-2xl font-semibold">${customer.averageServiceValue}</p>
          </div>
        </div>

        {/* Interaction Timeline */}
        <div className="border rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Interaction History</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              First Visit
            </div>
            <span>{new Date(customer.firstInteraction).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last Visit
            </div>
            <span>{new Date(customer.lastInteraction).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Total Interactions
            </div>
            <span>{customer.totalInteractions}</span>
          </div>
        </div>

        {/* Preferences */}
        {customer.preferences && Object.keys(customer.preferences).length > 0 && (
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Preferences</h4>
            {customer.preferences.preferredServices && (
              <div className="flex flex-wrap gap-2">
                {customer.preferences.preferredServices.map((service) => (
                  <Badge key={service} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
            {customer.preferences.communicationPreference && (
              <p className="text-sm text-muted-foreground">
                Prefers: {customer.preferences.communicationPreference}
              </p>
            )}
          </div>
        )}

        {/* Behavior Insights */}
        {(customer.noShows > 0 || customer.cancelledBookings > 0) && (
          <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <h4 className="font-medium text-sm">Behavior Alerts</h4>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {customer.noShows > 0 && (
                <p>• {customer.noShows} no-shows ({noShowRate}% rate)</p>
              )}
              {customer.cancelledBookings > 0 && (
                <p>• {customer.cancelledBookings} cancellations</p>
              )}
            </div>
          </div>
        )}

        {/* Notes Section */}
        {customer.notes && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground">{customer.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Customer memory list with search and filtering
 */
export function CustomerMemoryList({ 
  customers,
  onSelectCustomer 
}: { 
  customers: CustomerMemory[];
  onSelectCustomer: (customer: CustomerMemory) => void;
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterFlags, setFilterFlags] = React.useState<string[]>([]);

  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.phone.includes(searchTerm) ||
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFlags = filterFlags.length === 0 ||
        filterFlags.some(flag => customer.customFlags.includes(flag));

      return matchesSearch && matchesFlags;
    });
  }, [customers, searchTerm, filterFlags]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="cursor-pointer hover:bg-accent"
              onClick={() => onSelectCustomer(customer)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {customer.firstName?.[0]}{customer.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${customer.lifetimeValue}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.totalBookings} bookings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}