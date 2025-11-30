'use client';

import { useState } from 'react';
import { Switch } from '@workspace/ui/components/switch';
import { Badge } from '@workspace/ui/components/badge';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import type { EmailFeatureKey } from '~/lib/email/feature-toggle-service';

interface FeatureToggleSwitchProps {
  feature: EmailFeatureKey;
  label: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
  isCritical?: boolean;
  category: 'user' | 'admin' | 'marketing';
  onToggle: (feature: EmailFeatureKey, enabled: boolean) => Promise<void>;
  disabled?: boolean;
}

export function FeatureToggleSwitch({
  feature,
  label,
  description,
  enabled,
  loading = false,
  isCritical = false,
  category,
  onToggle,
  disabled = false
}: FeatureToggleSwitchProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (loading || isToggling || disabled) return;

    setIsToggling(true);
    try {
      await onToggle(feature, !enabled);
    } catch (error) {
      console.error(`Failed to toggle ${feature}:`, error);
    } finally {
      setIsToggling(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'marketing':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isProcessing = loading || isToggling;

  return (
    <div className={cn(
      "flex items-start justify-between p-4 border rounded-lg transition-colors",
      enabled 
        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50" 
        : "bg-gray-50 border-gray-200 dark:bg-slate-900/50 dark:border-slate-700",
      disabled && "opacity-50"
    )}>
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </h4>
          {isCritical && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              <Badge variant="outline" className="text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-800">
                Critical
              </Badge>
            </div>
          )}
          <Badge className={getCategoryColor(category)}>
            {category}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
        
        {isCritical && !enabled && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-900/50">
            ⚠️ This is a critical email feature. Ensure alternative mechanisms exist before disabling.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          {isProcessing && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={disabled || isProcessing}
            className={cn(
              enabled 
                ? "data-[state=checked]:bg-green-600" 
                : "bg-gray-200"
            )}
          />
        </div>
        <div className="w-16 text-right">
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded",
            enabled 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          )}>
            {enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
}