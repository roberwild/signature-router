'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Edit2, Trash2, Shield, ShieldOff, Mail, Building2, Copy, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { toast } from '@workspace/ui/components/sonner';

interface UserActionsProps {
  user: {
    id: string;
    name: string;
    email: string | null;
    isPlatformAdmin: boolean;
    hasLeadData?: boolean;
  };
  locale: string;
}

export function UserActions({ user, locale }: UserActionsProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteWithOrgDialogOpen, setIsDeleteWithOrgDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
  });

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      toast.success('User updated successfully');
      
      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      
      setIsDeleteDialogOpen(false);
      router.push(`/${locale}/admin/users`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWithOrganization = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/delete-with-organization`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user and organization');
      }

      toast.success('User and their organization deleted successfully');
      
      setIsDeleteWithOrgDialogOpen(false);
      router.push(`/${locale}/admin/users`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user and organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPlatformAdmin: !user.isPlatformAdmin }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update admin status');
      }

      toast.success(
        user.isPlatformAdmin 
          ? 'Admin privileges removed' 
          : 'Admin privileges granted'
      );
      
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update admin status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/send-password-reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send password reset email');
      }

      toast.success('Password reset email sent successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(user.id);
              toast.success('User ID copied to clipboard');
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy user ID
          </DropdownMenuItem>
          {user.email && (
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(user.email!);
                toast.success('Email copied to clipboard');
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy email
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin/users/${user.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>
          {user.hasLeadData && (
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/admin/leads?user=${user.id}`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                View lead data
              </Link>
            </DropdownMenuItem>
          )}
          {user.email && (
            <DropdownMenuItem asChild>
              <a href={`mailto:${user.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Send email
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendPasswordReset} disabled={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            Send Password Reset
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleAdmin} disabled={isLoading}>
            {user.isPlatformAdmin ? (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                Remove Admin
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Make Admin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setIsDeleteWithOrgDialogOpen(true)}
            className="text-destructive"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Delete User & Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user's name and email. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              "{user.name}" and remove all associated data including their memberships,
              evaluations, and activity history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User & Organization Confirmation Dialog */}
      <AlertDialog open={isDeleteWithOrgDialogOpen} onOpenChange={setIsDeleteWithOrgDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Delete User & Organization</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="font-medium text-destructive">
                  This is a destructive action that cannot be undone.
                </p>
                <p>
                  This will permanently delete:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>User "{user.name}" and all their data</li>
                  <li>All organizations they own (if they are the sole owner)</li>
                  <li>All organization data: contacts, evaluations, incidents, assessments</li>
                  <li>All memberships, API keys, and related records</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  If the user is part of organizations with other owners, only their membership will be removed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWithOrganization}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete User & Organization'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}