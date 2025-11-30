'use client';

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
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';

interface DeleteServiceRequestButtonProps {
  requestId: string;
  contactName: string;
  locale: string;
}

export function DeleteServiceRequestButton({ 
  requestId, 
  contactName, 
  locale 
}: DeleteServiceRequestButtonProps) {
  const router = useRouter();
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/services/${requestId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push(`/${locale}/admin/services`);
      } else {
        console.error('Failed to delete service request');
      }
    } catch (error) {
      console.error('Error deleting service request:', error);
    }
  };
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this service request from {contactName}? 
            This action cannot be undone and will remove all associated messages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}