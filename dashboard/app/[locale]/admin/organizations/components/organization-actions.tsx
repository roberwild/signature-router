'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Edit2, Trash2, Link2, UserCheck, Copy, Users, Mail, UserPlus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';

interface OrganizationActionsProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    industry?: string | null;
    owner?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  locale: string;
  dict?: {
    toasts?: {
      failedToLoadMembers?: string;
      failedToLoadUsers?: string;
      selectUser?: string;
      memberAddedSuccess?: string;
      failedToAddMember?: string;
      selectNewOwner?: string;
      ownershipTransferredSuccess?: string;
      failedToTransferOwnership?: string;
      organizationUpdatedSuccess?: string;
      failedToUpdateOrganization?: string;
      organizationDeletedSuccess?: string;
      failedToDeleteOrganization?: string;
      organizationIdCopied?: string;
      slugCopied?: string;
    };
    actions?: {
      openMenu?: string;
      actions?: string;
      copyOrganizationId?: string;
      copySlug?: string;
      viewOrganization?: string;
      viewMembers?: string;
      contactOwner?: string;
      editDetails?: string;
      addMember?: string;
      transferOwnership?: string;
      deleteOrganization?: string;
      cancel?: string;
      saving?: string;
      saveChanges?: string;
    };
    dialogs?: {
      editOrganization?: {
        title?: string;
        description?: string;
        organizationName?: string;
        nameplaceholder?: string;
        urlSlug?: string;
        slugPlaceholder?: string;
        urlPreview?: string;
      };
    };
  };
}

export function OrganizationActions({ organization, locale, dict }: OrganizationActionsProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransferOwnershipDialogOpen, setIsTransferOwnershipDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<Array<{id: string; name: string; email: string}>>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string; name: string; email: string}>>([]);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>('');
  const [selectedNewMemberId, setSelectedNewMemberId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formData, setFormData] = useState({
    name: organization.name,
    slug: organization.slug,
  });

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}/members`);
      if (response.ok) {
        const membersData = await response.json();
        // Filter out the current owner
        const nonOwnerMembers = membersData.filter((member: Record<string, unknown>) => 
          member.id !== organization.owner?.id
        );
        setMembers(nonOwnerMembers);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error(dict?.toasts?.failedToLoadMembers || 'Failed to load organization members');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // Fetch all users who are not members of this organization
      const response = await fetch(`/api/admin/organizations/${organization.id}/available-users`);
      if (response.ok) {
        const usersData = await response.json();
        setAvailableUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to fetch available users:', error);
      toast.error(dict?.toasts?.failedToLoadUsers || 'Failed to load available users');
    }
  };

  const handleAddMember = async () => {
    if (!selectedNewMemberId) {
      toast.error(dict?.toasts?.selectUser || 'Please select a user to add');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedNewMemberId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }

      toast.success(dict?.toasts?.memberAddedSuccess || 'Member added successfully');
      setIsAddMemberDialogOpen(false);
      setSelectedNewMemberId('');
      setSearchQuery('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (dict?.toasts?.failedToAddMember || 'Failed to add member'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwnerId) {
      toast.error(dict?.toasts?.selectNewOwner || 'Please select a new owner');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOwnerId: selectedNewOwnerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transfer ownership');
      }

      toast.success(dict?.toasts?.ownershipTransferredSuccess || 'Ownership transferred successfully');
      setIsTransferOwnershipDialogOpen(false);
      setSelectedNewOwnerId('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (dict?.toasts?.failedToTransferOwnership || 'Failed to transfer ownership'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update organization');
      }

      toast.success(dict?.toasts?.organizationUpdatedSuccess || 'Organization updated successfully');
      
      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (dict?.toasts?.failedToUpdateOrganization || 'Failed to update organization'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organization.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization');
      }

      toast.success(dict?.toasts?.organizationDeletedSuccess || 'Organization deleted successfully');
      
      setIsDeleteDialogOpen(false);
      router.push(`/${locale}/admin/organizations`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (dict?.toasts?.failedToDeleteOrganization || 'Failed to delete organization'));
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
            <span className="sr-only">{dict?.actions?.openMenu || "Open menu"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{dict?.actions?.actions || "Actions"}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(organization.id);
              toast.success(dict?.toasts?.organizationIdCopied || 'Organization ID copied to clipboard');
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            {dict?.actions?.copyOrganizationId || "Copy organization ID"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(organization.slug);
              toast.success(dict?.toasts?.slugCopied || 'Slug copied to clipboard');
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            {dict?.actions?.copySlug || "Copy slug"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.open(`/${locale}/organizations/${organization.slug}/home`, '_blank')}>
            <Link2 className="mr-2 h-4 w-4" />
            {dict?.actions?.viewOrganization || "View Organization"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin/users?organization=${organization.slug}`}>
              <Users className="mr-2 h-4 w-4" />
              {dict?.actions?.viewMembers || "View members"}
            </Link>
          </DropdownMenuItem>
          {organization.owner && (
            <DropdownMenuItem asChild>
              <a href={`mailto:${organization.owner.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                {dict?.actions?.contactOwner || "Contact owner"}
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            {dict?.actions?.editDetails || "Edit Details"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            fetchAvailableUsers();
            setIsAddMemberDialogOpen(true);
          }}>
            <UserPlus className="mr-2 h-4 w-4" />
            {dict?.actions?.addMember || "Add Member"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            fetchMembers();
            setIsTransferOwnershipDialogOpen(true);
          }}>
            <UserCheck className="mr-2 h-4 w-4" />
            {dict?.actions?.transferOwnership || "Transfer Ownership"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {dict?.actions?.deleteOrganization || "Delete Organization"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict?.dialogs?.editOrganization?.title || "Edit Organization"}</DialogTitle>
            <DialogDescription>
              {dict?.dialogs?.editOrganization?.description || "Update the organization's name and slug. These changes will affect how the organization appears across the platform."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{dict?.dialogs?.editOrganization?.organizationName || "Organization Name"}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={dict?.dialogs?.editOrganization?.nameplaceholder || "Enter organization name"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">{dict?.dialogs?.editOrganization?.urlSlug || "URL Slug"}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={dict?.dialogs?.editOrganization?.slugPlaceholder || "organization-slug"}
                pattern="^[a-z0-9-]+$"
              />
              <p className="text-sm text-muted-foreground">
                {dict?.dialogs?.editOrganization?.urlPreview || "Used in URLs:"} /{locale}/organizations/{formData.slug || 'slug'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              {dict?.actions?.cancel || "Cancel"}
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? (dict?.actions?.saving || 'Saving...') : (dict?.actions?.saveChanges || 'Save Changes')}
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
              This action cannot be undone. This will permanently delete the organization
              "{organization.name}" and remove all associated data including members,
              evaluations, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete Organization'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={isTransferOwnershipDialogOpen} onOpenChange={setIsTransferOwnershipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Organization Ownership</DialogTitle>
            <DialogDescription>
              Select a new owner for "{organization.name}". The current owner is {organization.owner?.name || 'unknown'}.
              Only organization members can be selected as the new owner.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No other members found in this organization. 
                  Members must be added to the organization before ownership can be transferred.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="new-owner">Select New Owner</Label>
                <Select value={selectedNewOwnerId} onValueChange={setSelectedNewOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member to become the new owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The selected member will become the new owner and gain full administrative access to the organization.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTransferOwnershipDialogOpen(false);
                setSelectedNewOwnerId('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTransferOwnership} 
              disabled={isLoading || members.length === 0 || !selectedNewOwnerId}
            >
              {isLoading ? 'Transferring...' : 'Transfer Ownership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Organization</DialogTitle>
            <DialogDescription>
              Select a user to add as a member to "{organization.name}". 
              They will gain access to view and manage organization data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No available users found. All platform users are already members of this organization.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="search">Search Users</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Filter users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Label htmlFor="new-member">Select User</Label>
                <Select value={selectedNewMemberId} onValueChange={setSelectedNewMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user to add as member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter(user => 
                        searchQuery === '' ||
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The selected user will become a member and can access organization resources.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberDialogOpen(false);
                setSelectedNewMemberId('');
                setSearchQuery('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember} 
              disabled={isLoading || availableUsers.length === 0 || !selectedNewMemberId}
            >
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}