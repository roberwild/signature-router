'use client';

import { useState, useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Leer estado inicial
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setSidebarCollapsed(savedState === 'true');
    }

    // Escuchar cambios
    const handleToggle = () => {
      const newState = localStorage.getItem('sidebar-collapsed') === 'true';
      setSidebarCollapsed(newState);
    };

    window.addEventListener('sidebar-toggle', handleToggle);
    return () => window.removeEventListener('sidebar-toggle', handleToggle);
  }, []);

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      <AdminSidebar />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-64'}`}>
        {children}
      </main>
    </div>
  );
}

