import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';

interface PermissionGuardProps {
  hasPermission: boolean;
  children: React.ReactNode;
  requiredPermission?: string;
}

export function PermissionGuard({ 
  hasPermission, 
  children, 
  requiredPermission = 'modify settings' 
}: PermissionGuardProps) {
  if (!hasPermission) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <ShieldOff className="h-4 w-4" />
          <div>
            <AlertTitle className="ml-6 mt-1">Permission Denied</AlertTitle>
            <AlertDescription className="mt-1">
              You don't have permission to {requiredPermission}. 
              Your current role only allows read-only access to the questionnaire system.
            </AlertDescription>
          </div>
        </Alert>
        
        <div className="mt-6 flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/questionnaires">
              Back to Questionnaires
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">
              Admin Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}