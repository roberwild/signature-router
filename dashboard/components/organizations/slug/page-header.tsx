'use client';

import { 
  FileWarning, 
  ClipboardCheck, 
  Users, 
  Shield, 
  Plus, 
  Settings,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Search
} from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';

const iconMap = {
  FileWarning,
  ClipboardCheck,
  Users,
  Shield,
  Plus,
  Settings,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Search,
} as const;

type IconName = keyof typeof iconMap;

interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  icon?: IconName;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: IconName;
  actions?: PageHeaderAction[];
  badges?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }[];
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  badges,
  className,
}: PageHeaderProps) {
  const Icon = icon ? iconMap[icon] : null;
  
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-8 w-8 text-primary" />}
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {badges && badges.length > 0 && (
              <div className="flex items-center gap-2">
                {badges.map((badge, index) => (
                  <Badge key={index} variant={badge.variant}>
                    {badge.text}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-3xl">{description}</p>
          )}
        </div>
        
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-3">
            {actions.map((action, index) => {
              const ActionIcon = action.icon ? iconMap[action.icon] : null;
              const content = (
                <>
                  {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                  {action.label}
                  {action.badge && (
                    <Badge 
                      variant={action.badge.variant} 
                      className="ml-2"
                    >
                      {action.badge.text}
                    </Badge>
                  )}
                </>
              );

              if (action.href) {
                return (
                  <a key={index} href={action.href}>
                    <button 
                      className={cn(
                        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                        'h-10 px-4 py-2',
                        action.variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                        action.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                        action.variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                        action.variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
                        action.variant === 'link' && 'text-primary underline-offset-4 hover:underline',
                        (!action.variant || action.variant === 'default') && 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      {content}
                    </button>
                  </a>
                );
              }

              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                    'h-10 px-4 py-2',
                    action.variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    action.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                    action.variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                    action.variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
                    action.variant === 'link' && 'text-primary underline-offset-4 hover:underline',
                    (!action.variant || action.variant === 'default') && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}