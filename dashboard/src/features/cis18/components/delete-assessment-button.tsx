'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import { Button } from '@workspace/ui/components/button';

interface DeleteAssessmentButtonProps {
  assessmentId: string;
  assessmentDate: Date;
  onDeleteSuccess?: () => void;
  redirectUrl?: string;
}

export function DeleteAssessmentButton({ 
  assessmentId, 
  assessmentDate,
  onDeleteSuccess,
  redirectUrl 
}: DeleteAssessmentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cis18/${assessmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsOpen(false);
        
        if (onDeleteSuccess) {
          onDeleteSuccess();
        } else if (redirectUrl) {
          // Redirect to the specified URL
          router.push(redirectUrl);
        } else {
          // Refresh the page to show updated data
          router.refresh();
        }
      } else {
        throw new Error('Failed to delete assessment');
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      // Keep the dialog open on error so user can try again
      alert('No se pudo eliminar la evaluación. Por favor, intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="sr-only">Eliminar evaluación</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la evaluación CIS-18 
            del {new Date(assessmentDate).toLocaleDateString('es-ES')}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}