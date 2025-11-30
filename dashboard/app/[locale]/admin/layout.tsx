/**
 * Admin Layout
 * Wraps all admin pages with sidebar navigation
 * Requires platform admin authentication
 */

import { redirect } from 'next/navigation';
import { auth } from '@workspace/auth';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { requirePlatformAdmin } from '~/middleware/admin';
import { AdminSidebar } from './components/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // Check admin authorization
  await requirePlatformAdmin();

  // Get user profile for sidebar
  const profile = {
    name: session.user.name || 'Admin',
    email: session.user.email || '',
    image: session.user.image,
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-singular-gray">
        <AdminSidebar profile={profile} />
        <main className="flex-1 overflow-y-auto bg-singular-gray">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
