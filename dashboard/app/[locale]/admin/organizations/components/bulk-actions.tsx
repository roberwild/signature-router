'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
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
import { toast } from '@workspace/ui/components/sonner';
import { Checkbox } from '@workspace/ui/components/checkbox';

interface Organization {
  id: string;
  name: string;
  slug: string;
  memberCount?: number;
}

interface BulkActionsProps {
  organizations: Organization[];
}

export function BulkActions({ organizations }: BulkActionsProps) {
  const router = useRouter();
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelection = (orgId: string) => {
    const newSelection = new Set(selectedOrgs);
    if (newSelection.has(orgId)) {
      newSelection.delete(orgId);
    } else {
      newSelection.add(orgId);
    }
    setSelectedOrgs(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedOrgs.size === organizations.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(organizations.map(org => org.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const errors: string[] = [];
    const successes: string[] = [];

    for (const orgId of selectedOrgs) {
      try {
        const response = await fetch(`/api/admin/organizations/${orgId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const org = organizations.find(o => o.id === orgId);
          errors.push(org?.name || orgId);
        } else {
          const org = organizations.find(o => o.id === orgId);
          successes.push(org?.name || orgId);
        }
      } catch (_error) {
        const org = organizations.find(o => o.id === orgId);
        errors.push(org?.name || orgId);
      }
    }

    if (successes.length > 0) {
      toast.success(`Successfully deleted ${successes.length} organization(s)`);
    }

    if (errors.length > 0) {
      toast.error(`Failed to delete: ${errors.join(', ')}`);
    }

    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setSelectedOrgs(new Set());
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <Checkbox
          checked={selectedOrgs.size === organizations.length && organizations.length > 0}
          onCheckedChange={toggleAllSelection}
          aria-label="Select all organizations"
        />
        <span className="text-sm text-muted-foreground">
          {selectedOrgs.size > 0 
            ? `${selectedOrgs.size} organization(s) selected`
            : 'Select organizations to manage'
          }
        </span>
        {selectedOrgs.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedOrgs.size})
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {organizations.map((org) => (
          <div key={org.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
            <Checkbox
              checked={selectedOrgs.has(org.id)}
              onCheckedChange={() => toggleSelection(org.id)}
              aria-label={`Select ${org.name}`}
            />
            <div className="flex-1">
              <p className="font-medium">{org.name}</p>
              <p className="text-sm text-muted-foreground">/{org.slug}</p>
            </div>
            {org.memberCount !== undefined && (
              <span className="text-sm text-muted-foreground">
                {org.memberCount} member(s)
              </span>
            )}
          </div>
        ))}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedOrgs.size} organizations?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected organizations
              and remove all associated data including members, evaluations, and settings.
              <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                <p className="text-sm font-medium mb-2">Organizations to be deleted:</p>
                <ul className="text-sm space-y-1">
                  {Array.from(selectedOrgs).map(id => {
                    const org = organizations.find(o => o.id === id);
                    return org ? <li key={id}>• {org.name}</li> : null;
                  })}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? `Deleting...` : `Delete ${selectedOrgs.size} Organizations`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}