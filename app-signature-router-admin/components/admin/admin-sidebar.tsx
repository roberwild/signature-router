'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { performKeycloakLogout } from '@/lib/auth-utils';
import { useApiClientWithStatus } from '@/lib/api/use-api-client';
import {
  LayoutDashboard,
  Settings,
  FileSignature,
  Server,
  BarChart3,
  Shield,
  Bell,
  Users,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Badges dinámicos - se actualizan desde el backend
interface DynamicBadges {
  pendingSignatures: number;
  activeAlerts: number;
}

const getNavigation = (badges: DynamicBadges) => [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Reglas de Routing',
    href: '/admin/rules',
    icon: Settings,
    badge: null,
  },
  {
    name: 'Monitoreo de Firmas',
    href: '/admin/signatures',
    icon: FileSignature,
    badge: badges.pendingSignatures > 0 
      ? { value: badges.pendingSignatures, variant: 'warning' as const }
      : null,
  },
  {
    name: 'Proveedores',
    href: '/admin/providers',
    icon: Server,
    badge: null,
  },
  {
    name: 'Métricas',
    href: '/admin/metrics',
    icon: BarChart3,
    badge: null,
  },
  {
    name: 'Seguridad',
    href: '/admin/security',
    icon: Shield,
    badge: null,
  },
  {
    name: 'Alertas',
    href: '/admin/alerts',
    icon: Bell,
    badge: badges.activeAlerts > 0 
      ? { value: badges.activeAlerts, variant: 'error' as const }
      : null,
  },
  {
    name: 'Usuarios',
    href: '/admin/users',
    icon: Users,
    badge: null,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { apiClient, isLoading: sessionLoading, isAuthenticated } = useApiClientWithStatus();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [badges, setBadges] = useState<DynamicBadges>({ pendingSignatures: 0, activeAlerts: 0 });

  // Cargar badges dinámicos - solo si hay sesión autenticada
  const loadBadges = useCallback(async () => {
    // No intentar cargar si no hay sesión autenticada
    if (!isAuthenticated) {
      return;
    }
    
    try {
      // Cargar conteos en paralelo
      const [signaturesResult, alertsResult] = await Promise.allSettled([
        apiClient.getSignatureRequests({ status: 'PENDING', size: 1 }),
        apiClient.getAlerts({ status: 'ACTIVE' }),
      ]);

      const pendingSignatures = signaturesResult.status === 'fulfilled' 
        ? signaturesResult.value.totalElements 
        : 0;
      
      const activeAlerts = alertsResult.status === 'fulfilled'
        ? alertsResult.value.filter((a: any) => a.status === 'ACTIVE').length
        : 0;

      setBadges({ pendingSignatures, activeAlerts });
    } catch (error) {
      // Silently fail - badges will show 0
      console.warn('Failed to load sidebar badges:', error);
    }
  }, [isAuthenticated, apiClient]);

  useEffect(() => {
    setMounted(true);
    // Leer estado inicial del localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  // Cargar badges cuando la sesión esté lista
  useEffect(() => {
    if (isAuthenticated && !sessionLoading) {
      // Cargar badges iniciales
      loadBadges();
      
      // Refrescar badges cada 60 segundos
      const interval = setInterval(loadBadges, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, sessionLoading, loadBadges]);
  
  // Generar navegación con badges actuales
  const navigation = getNavigation(badges);

  // Guardar estado cuando cambie
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    // Disparar evento para que el layout se entere
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-background border-r border-border transition-all duration-300 ease-in-out flex flex-col',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4 bg-background relative">
        {!collapsed && mounted && (
          <div className="flex items-center gap-3 w-full">
            <Image
              src={theme === 'dark' ? '/singular-bank-logo.svg' : '/singular-bank-logo-black.png'}
              alt="Singular Bank"
              width={140}
              height={40}
              priority
            />
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        )}

        {/* Botón de Colapsar/Expandir */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleCollapsed}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-50",
                "h-6 w-6 rounded-full bg-background border-2 border-border",
                "flex items-center justify-center",
                "hover:bg-primary hover:border-primary hover:text-white",
                "transition-all duration-200 shadow-sm hover:shadow-md",
                "text-foreground",
                collapsed ? "-right-3" : "-right-3"
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? 'Expandir menú' : 'Colapsar menú'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navigation.map((item) => {
          // Para Dashboard (/admin), solo activar si es exactamente esa ruta
          // Para otras rutas, activar si coincide exactamente o si empieza con la ruta + '/'
          const isActive = mounted && (
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname?.startsWith(item.href + '/')
          );
          const linkContent = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/5',
                isActive
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'text-muted-foreground hover:text-foreground',
                collapsed && 'justify-center'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0')} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge
                      variant={
                        item.badge.variant === 'error'
                          ? 'destructive'
                          : item.badge.variant === 'warning'
                            ? 'secondary'
                            : 'default'
                      }
                      className={cn(
                        'h-5 min-w-[20px] px-1.5',
                        item.badge.variant === 'warning' && 'bg-yellow-500 hover:bg-yellow-600',
                        isActive && 'bg-white text-primary'
                      )}
                    >
                      {item.badge.value}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.name}
                  {item.badge && (
                    <Badge
                      variant={
                        item.badge.variant === 'error'
                          ? 'destructive'
                          : item.badge.variant === 'warning'
                            ? 'secondary'
                            : 'default'
                      }
                      className={cn(
                        'h-5 min-w-[20px] px-1.5 ml-2',
                        item.badge.variant === 'warning' && 'bg-yellow-500 hover:bg-yellow-600'
                      )}
                    >
                      {item.badge.value}
                    </Badge>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 flex-shrink-0 space-y-2">
        {/* Cerrar Sesión */}
        {!collapsed ? (
          <button
            onClick={() => performKeycloakLogout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors text-sm text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => performKeycloakLogout()}
                className="w-full flex justify-center py-2 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Cerrar Sesión
            </TooltipContent>
          </Tooltip>
        )}

        {/* Toggle Modo Oscuro */}
        {!collapsed ? (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
          >
            {mounted && theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full flex justify-center py-2 rounded-lg hover:bg-accent transition-colors"
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Estado del Sistema */}
        {!collapsed ? (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-900 dark:text-green-100">Sistema Operativo</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Todos los servicios funcionando correctamente
            </p>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center py-1 cursor-pointer">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div>
                <div className="font-medium">Sistema Operativo</div>
                <div className="text-xs text-muted-foreground">
                  Todos los servicios funcionando
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

