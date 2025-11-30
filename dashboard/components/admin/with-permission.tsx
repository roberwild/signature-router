'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Permission } from '~/lib/admin/permissions';

interface WithPermissionProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WithPermission({ permission, children, fallback }: WithPermissionProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const _router = useRouter();

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch(`/api/admin/check-permission?permission=${permission}`);
        const data = await response.json();
        setHasAccess(data.hasAccess);
      } catch (error) {
        console.error('Failed to check permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [permission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2">
          You don't have permission to access this feature.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}