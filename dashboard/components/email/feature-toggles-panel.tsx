'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Power, PowerOff } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog';

import { FeatureToggleSwitch } from './feature-toggle-switch';
import type { EmailFeatureToggles, EmailFeatureKey } from '~/lib/email/feature-toggle-service';

interface FeatureTogglesConfig {
  feature: EmailFeatureKey;
  label: string;
  description: string;
  isCritical: boolean;
  category: 'user' | 'admin' | 'marketing';
}

const FEATURE_CONFIGS: FeatureTogglesConfig[] = [
  {
    feature: 'welcomeEmails',
    label: 'Welcome Emails',
    description: 'Sent to new users after registration',
    isCritical: false,
    category: 'user'
  },
  {
    feature: 'passwordResetEmails',
    label: 'Password Reset',
    description: 'Critical for user access recovery',
    isCritical: true,
    category: 'user'
  },
  {
    feature: 'invitationEmails',
    label: 'Invitation Emails',
    description: 'Sent when users are invited to join',
    isCritical: false,
    category: 'user'
  },
  {
    feature: 'feedbackEmails',
    label: 'Feedback Alerts',
    description: 'Notifies admins of new feedback',
    isCritical: false,
    category: 'admin'
  },
  {
    feature: 'adminAlerts',
    label: 'System Alerts',
    description: 'Critical system notifications',
    isCritical: true,
    category: 'admin'
  },
  {
    feature: 'organizationNotifications',
    label: 'Organization Notifications',
    description: 'Organization-wide notifications',
    isCritical: false,
    category: 'admin'
  },
  {
    feature: 'leadQualificationEmails',
    label: 'Lead Qualification',
    description: 'Automated lead nurturing emails',
    isCritical: false,
    category: 'marketing'
  }
];

interface FeatureTogglesPanelProps {
  initialToggles?: EmailFeatureToggles;
  onToggleChange?: (feature: EmailFeatureKey, enabled: boolean) => void;
}

export function FeatureTogglesPanel({ 
  initialToggles,
  onToggleChange 
}: FeatureTogglesPanelProps) {
  const [toggles, setToggles] = useState<EmailFeatureToggles | null>(initialToggles || null);
  const [loading, setLoading] = useState(!initialToggles);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState<'enable' | 'disable' | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load toggles if not provided
  useEffect(() => {
    if (!initialToggles) {
      loadToggles();
    }
  }, [initialToggles]);

  const loadToggles = async () => {
    try {
      const response = await fetch('/api/admin/email-settings/toggles');
      if (!response.ok) throw new Error('Failed to load toggles');
      
      const data = await response.json();
      setToggles(data.toggles);
    } catch (error) {
      console.error('Failed to load feature toggles:', error);
      toast.error('Failed to load feature toggles');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (feature: EmailFeatureKey, enabled: boolean) => {
    if (!toggles) return;

    const config = FEATURE_CONFIGS.find(c => c.feature === feature);
    
    // Show confirmation for critical features being disabled
    if (!enabled && config?.isCritical) {
      const confirmed = window.confirm(
        `Are you sure you want to disable ${config.label}? This is a critical feature that may affect user access or system functionality.`
      );
      if (!confirmed) return;
    }

    try {
      const response = await fetch('/api/admin/email-settings/toggles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feature, 
          enabled,
          reason: `Manual toggle via admin panel`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update toggle');
      }

      // Update local state
      const newToggles = { ...toggles, [feature]: enabled };
      setToggles(newToggles);
      
      // Notify parent component
      onToggleChange?.(feature, enabled);
      
      toast.success(`${config?.label || feature} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error(`Failed to toggle ${feature}:`, error);
      toast.error(`Failed to update ${config?.label || feature}`);
    }
  };

  const handleBulkOperation = async (operation: 'enable' | 'disable' | 'reset') => {
    setBulkLoading(true);
    
    try {
      const endpoint = operation === 'reset' 
        ? '/api/admin/email-settings/toggles/reset'
        : '/api/admin/email-settings/toggles/bulk';
        
      const body = operation === 'reset' 
        ? { reason: 'Reset to defaults via admin panel' }
        : { 
            enabled: operation === 'enable',
            excludeCritical: true,
            reason: `Bulk ${operation} via admin panel`
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${operation} features`);
      }

      // Reload toggles
      await loadToggles();
      
      toast.success(`Successfully ${operation}d feature toggles`);
    } catch (error) {
      console.error(`Failed to ${operation} features:`, error);
      toast.error(`Failed to ${operation} feature toggles`);
    } finally {
      setBulkLoading(false);
      setShowBulkConfirm(null);
      setShowResetConfirm(false);
    }
  };

  // Group features by category
  const groupedFeatures = FEATURE_CONFIGS.reduce((groups, config) => {
    if (!groups[config.category]) {
      groups[config.category] = [];
    }
    groups[config.category].push(config);
    return groups;
  }, {} as Record<string, FeatureTogglesConfig[]>);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'user':
        return 'User Emails';
      case 'admin':
        return 'Admin Notifications';
      case 'marketing':
        return 'Marketing & Engagement';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading feature toggles...</span>
        </CardContent>
      </Card>
    );
  }

  if (!toggles) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertDescription>
              Failed to load feature toggles. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const enabledCount = Object.values(toggles).filter(Boolean).length;
  const totalCount = Object.keys(toggles).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚙️ Email Features
          </CardTitle>
          <CardDescription>
            Control which types of emails are sent. Changes take effect immediately.
          </CardDescription>
          
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {enabledCount} of {totalCount} features enabled
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkConfirm('enable')}
                disabled={bulkLoading}
              >
                <Power className="h-4 w-4 mr-1" />
                Enable All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkConfirm('disable')}
                disabled={bulkLoading}
              >
                <PowerOff className="h-4 w-4 mr-1" />
                Disable All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowResetConfirm(true)}
                disabled={bulkLoading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {getCategoryTitle(category)}
              </h3>
              
              <div className="space-y-3">
                {features.map((config) => (
                  <FeatureToggleSwitch
                    key={config.feature}
                    feature={config.feature}
                    label={config.label}
                    description={config.description}
                    enabled={toggles[config.feature]}
                    isCritical={config.isCritical}
                    category={config.category}
                    onToggle={handleToggle}
                    loading={bulkLoading}
                  />
                ))}
              </div>
              
              {category !== 'marketing' && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bulk Enable/Disable Confirmation */}
      <AlertDialog 
        open={showBulkConfirm !== null} 
        onOpenChange={() => setShowBulkConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showBulkConfirm === 'enable' ? 'Enable All Features' : 'Disable All Features'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showBulkConfirm === 'enable' 
                ? 'This will enable all email features except those currently disabled for critical reasons.'
                : 'This will disable all non-critical email features. Critical features like password resets will remain enabled.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkOperation(showBulkConfirm!)}
              disabled={bulkLoading}
            >
              {bulkLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {showBulkConfirm === 'enable' ? 'Enable All' : 'Disable All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all feature toggles to their default enabled state. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkOperation('reset')}
              disabled={bulkLoading}
            >
              {bulkLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}