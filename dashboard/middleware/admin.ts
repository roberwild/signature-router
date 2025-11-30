/**
 * Admin Middleware
 * Protects admin routes and ensures only platform admins can access them
 */

import { redirect } from 'next/navigation';
import { auth } from '@workspace/auth';

/**
 * Requires the current user to be a platform admin
 * Redirects to home if not authorized
 */
export async function requirePlatformAdmin(): Promise<void> {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/sign-in');
  }
  
  // Check if user has platform admin flag
  // Note: This assumes the user object has an isPlatformAdmin property
  // You may need to adjust this based on your auth setup
  const isPlatformAdmin = (session.user as any).isPlatformAdmin;
  
  if (!isPlatformAdmin) {
    redirect('/');
  }
}

/**
 * Checks if the current user is a platform admin
 * Returns boolean without redirecting
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user) {
    return false;
  }
  
  return (session.user as any).isPlatformAdmin === true;
}
