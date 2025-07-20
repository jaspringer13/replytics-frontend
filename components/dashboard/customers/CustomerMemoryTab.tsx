"use client"

import React from 'react';
import { CustomerMemory } from '@/app/models/dashboard';
import { 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Star,
  User,
  MessageSquare
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils';

interface CustomerMemoryTabProps {
  customer: CustomerMemory;
}

export function CustomerMemoryTab({ customer }: CustomerMemoryTabProps) {
  const noShowRate = customer.totalBookings > 0 
    ? ((customer.noShows / customer.totalBookings) * 100).toFixed(1)
    : '0';

  const showRate = customer.totalBookings > 0
    ? ((customer.completedBookings / customer.totalBookings) * 100).toFixed(1)
    : '0';

  const cancellationRate = customer.totalBookings > 0
    ? ((customer.cancelledBookings / customer.totalBookings) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Booking Statistics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Booking Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Bookings</span>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-white">{customer.totalBookings}</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Show Rate</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{showRate}%</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">No-Show Rate</span>
              <AlertCircle className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-400">{noShowRate}%</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Cancellations</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{cancellationRate}%</p>
          </div>
        </div>
      </div>

      {/* Interaction Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Customer Journey
        </h3>
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">First Visit</span>
            </div>
            <span className="text-white text-sm">
              {formatDate(new Date(customer.firstInteraction))}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Last Visit</span>
            </div>
            <span className="text-white text-sm">
              {formatDate(new Date(customer.lastInteraction))}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Total Interactions</span>
            </div>
            <span className="text-white text-sm">{customer.totalInteractions}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Preferences */}
      {customer.preferences && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Customer Preferences
          </h3>
          <div className="space-y-3">
            {customer.preferences.preferredServices && customer.preferences.preferredServices.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Preferred Services</p>
                <div className="flex flex-wrap gap-2">
                  {customer.preferences.preferredServices.map((service, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {customer.preferences.preferredStaff && customer.preferences.preferredStaff.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Preferred Staff</p>
                <div className="flex flex-wrap gap-2">
                  {customer.preferences.preferredStaff.map((staff, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      {staff}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {customer.preferences.communicationPreference && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Communication Preference</p>
                <p className="text-white capitalize">{customer.preferences.communicationPreference}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Behavior Insights */}
      {(customer.noShows > 0 || customer.cancelledBookings > 0 || customer.bookingPatterns) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Behavior Insights
          </h3>
          
          {(customer.noShows > 0 || customer.cancelledBookings > 0) && (
            <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4 space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 w-4 text-orange-400" />
                <h4 className="font-medium text-sm text-orange-300">Attention Required</h4>
              </div>
              <div className="space-y-1 text-sm text-gray-300">
                {customer.noShows > 0 && (
                  <p>• {customer.noShows} no-shows ({noShowRate}% rate)</p>
                )}
                {customer.cancelledBookings > 0 && (
                  <p>• {customer.cancelledBookings} cancellations ({cancellationRate}% rate)</p>
                )}
              </div>
            </div>
          )}
          
          {customer.bookingPatterns && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              {customer.bookingPatterns.typicalDayOfWeek && customer.bookingPatterns.typicalDayOfWeek.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400">Typically books on</p>
                  <p className="text-white">{customer.bookingPatterns.typicalDayOfWeek.join(', ')}</p>
                </div>
              )}
              
              {customer.bookingPatterns.typicalTimeOfDay && (
                <div>
                  <p className="text-sm text-gray-400">Preferred time</p>
                  <p className="text-white">{customer.bookingPatterns.typicalTimeOfDay}</p>
                </div>
              )}
              
              {customer.bookingPatterns.advanceBookingDays !== undefined && (
                <div>
                  <p className="text-sm text-gray-400">Books in advance</p>
                  <p className="text-white">{customer.bookingPatterns.advanceBookingDays} days</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customer Notes */}
      {customer.notes && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Notes
          </h3>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}