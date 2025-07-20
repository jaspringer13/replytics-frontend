/**
 * StaffManagementTab Component
 * Manages staff members and their permissions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Shield,
  Crown,
  User,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { StaffMember, StaffCreateRequest, StaffRole, DEFAULT_PERMISSIONS } from '@/app/models/staff';

interface StaffManagementTabProps {}

export const StaffManagementTab: React.FC<StaffManagementTabProps> = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('staff');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Edit staff dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffRole, setEditStaffRole] = useState<StaffRole>('staff');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load staff members on component mount
  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    try {
      setIsLoading(true);
      const members = await apiClient.getStaffMembers(); // Get all staff
      setStaffMembers(members || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setError('Failed to load staff members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'invited':
        return <Badge variant="secondary">Invited</Badge>;
      default:
        return <Badge variant="outline">Inactive</Badge>;
    }
  };

  const handleInviteStaff = async () => {
    if (!newStaffName.trim()) {
      setError('Please enter a staff member name.');
      return;
    }
    if (!newStaffEmail.trim()) {
      setError('Please enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStaffEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setIsInviting(true);
      setError(null);
      
      await apiClient.createStaffMember({
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        role: newStaffRole,
      });
      
      // Show success message
      setSuccessMessage(`Successfully invited ${newStaffName} to your team!`);
      
      // Refresh staff list
      await loadStaffMembers();
      
      // Reset form and close dialog
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffRole('staff');
      setIsInviteDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (err: any) {
      console.error('Failed to invite staff:', err);
      const errorMessage = err.message?.includes('already exists') 
        ? 'A staff member with this email already exists.'
        : 'Failed to invite staff member. Please try again.';
      setError(errorMessage);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${staffName} from your team?`)) {
      return;
    }
    
    try {
      await apiClient.deleteStaffMember(staffId);
      setSuccessMessage(`Successfully removed ${staffName} from your team.`);
      await loadStaffMembers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to remove staff:', err);
      setError('Failed to remove staff member. Please try again.');
    }
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setEditStaffName(member.name);
    setEditStaffEmail(member.email || '');
    setEditStaffPhone(member.phone || '');
    setEditStaffRole(member.role);
    setIsEditDialogOpen(true);
    setError(null);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      await apiClient.updateStaffMember(editingStaff.id, {
        name: editStaffName,
        email: editStaffEmail,
        phone: editStaffPhone || undefined,
        role: editStaffRole,
      });
      
      setSuccessMessage(`Successfully updated ${editStaffName}'s information.`);
      setIsEditDialogOpen(false);
      await loadStaffMembers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to update staff:', err);
      setError('Failed to update staff member. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      {/* Staff Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Staff Management
              </CardTitle>
              <CardDescription>
                Manage team members and their access permissions
              </CardDescription>
            </div>
            
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Staff Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new team member to join your business.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="staff-name">Full Name</Label>
                    <Input
                      id="staff-name"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="staff-email">Email Address</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="john@business.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="staff-role">Role</Label>
                    <select
                      id="staff-role"
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsInviteDialogOpen(false);
                      setError(null);
                    }}
                    disabled={isInviting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInviteStaff}
                    disabled={isInviting || !newStaffName.trim() || !newStaffEmail.trim()}
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Invitation'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update the staff member's information and role.
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editStaffName">Name</Label>
                <Input
                  id="editStaffName"
                  type="text"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                  placeholder="Staff member's name"
                  disabled={isUpdating}
                />
              </div>
              
              <div>
                <Label htmlFor="editStaffEmail">Email</Label>
                <Input
                  id="editStaffEmail"
                  type="email"
                  value={editStaffEmail}
                  onChange={(e) => setEditStaffEmail(e.target.value)}
                  placeholder="Email address"
                  disabled={isUpdating}
                />
              </div>
              
              <div>
                <Label htmlFor="editStaffPhone">Phone (Optional)</Label>
                <Input
                  id="editStaffPhone"
                  type="tel"
                  value={editStaffPhone}
                  onChange={(e) => setEditStaffPhone(e.target.value)}
                  placeholder="Phone number"
                  disabled={isUpdating}
                />
              </div>
              
              <div>
                <Label htmlFor="editStaffRole">Role</Label>
                <select
                  id="editStaffRole"
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value as StaffRole)}
                  disabled={isUpdating}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setError(null);
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateStaff}
                disabled={isUpdating || !editStaffName || !editStaffEmail}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Staff Member'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <CardContent>
          <div className="space-y-4">
            {staffMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{member.name}</h3>
                      {getStatusBadge(member.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {member.email}
                      </span>
                      {member.phone && (
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {member.phone}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                      {member.last_login && (
                        <span className="text-xs text-muted-foreground">
                          Last login: {member.last_login}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {member.role !== 'owner' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditStaff(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveStaff(member.id, member.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            View and manage what each role can access
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Permission</th>
                  <th className="text-center py-2">Owner</th>
                  <th className="text-center py-2">Admin</th>
                  <th className="text-center py-2">Staff</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-3">Manage Bookings</td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">View Analytics</td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                  <td className="text-center"><Badge variant="secondary">–</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Manage Settings</td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                  <td className="text-center"><Badge variant="secondary">–</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Manage Staff</td>
                  <td className="text-center"><Badge className="bg-green-100 text-green-800">✓</Badge></td>
                  <td className="text-center"><Badge variant="secondary">–</Badge></td>
                  <td className="text-center"><Badge variant="secondary">–</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Account Security
          </CardTitle>
          <CardDescription>
            Configure security settings for your team
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require all team members to enable 2FA
              </p>
            </div>
            <Switch />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log out inactive users after 8 hours
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send email alerts for new staff invitations and role changes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};