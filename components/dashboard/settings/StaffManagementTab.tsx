"use client"

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, UserPlus, Shield, Calendar } from 'lucide-react';

interface StaffManagementTabProps {
  businessId: string;
}

export function StaffManagementTab({ businessId }: StaffManagementTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Team Members</h2>
          <Button className="bg-brand-500 hover:bg-brand-600" disabled>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Team Management Coming Soon</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Manage your team members, assign roles, and control access to different features of your voice agent and dashboard.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <Shield className="w-8 h-8 text-brand-400 mx-auto mb-2" />
              <h4 className="font-medium text-white mb-1">Role-Based Access</h4>
              <p className="text-sm text-gray-400">Control what each team member can access</p>
            </div>
            
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <Calendar className="w-8 h-8 text-brand-400 mx-auto mb-2" />
              <h4 className="font-medium text-white mb-1">Staff Scheduling</h4>
              <p className="text-sm text-gray-400">Manage individual staff availability</p>
            </div>
            
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <Users className="w-8 h-8 text-brand-400 mx-auto mb-2" />
              <h4 className="font-medium text-white mb-1">Service Assignment</h4>
              <p className="text-sm text-gray-400">Assign specific services to staff members</p>
            </div>
          </div>
        </div>
      </Card>

      <Alert className="bg-blue-900/20 border-blue-700">
        <AlertDescription className="text-gray-300">
          <strong className="text-white">Pro Tip:</strong> When team management is available, you'll be able to:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Add team members with different permission levels</li>
            <li>Assign specific services to individual staff members</li>
            <li>Set custom availability for each team member</li>
            <li>Track performance and bookings by staff member</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}