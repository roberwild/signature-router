'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from '~/hooks/use-translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ServerIcon, Settings, ToggleLeft, Bell } from 'lucide-react';

import { ProviderTab } from './tabs/provider-tab';
import { GeneralSettingsTab } from './tabs/general-settings-tab';
import { FeaturesTab } from './tabs/features-tab';
import { NotificationsTab } from './tabs/notifications-tab';
import type { EmailSettingsFormData } from '../types';

interface EmailSettingsTabsProps {
  initialSettings?: EmailSettingsFormData & { id?: string };
}

export function EmailSettingsTabs({ initialSettings }: EmailSettingsTabsProps) {
  const { t } = useTranslations('admin/email-settings.tabs');
  const [activeTab, setActiveTab] = useState('provider');
  const [currentSettings, setCurrentSettings] = useState(initialSettings);

  // Callback to update settings when features are changed
  const onFeaturesUpdate = useCallback((updatedFeatures: Record<string, boolean>) => {
    setCurrentSettings((prev) => prev ? ({
      ...prev,
      features: updatedFeatures as unknown as EmailSettingsFormData['features']
    }) : undefined);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
        <TabsTrigger value="provider" className="flex items-center gap-2">
          <ServerIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('provider')}</span>
        </TabsTrigger>
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">{t('general')}</span>
        </TabsTrigger>
        <TabsTrigger value="features" className="flex items-center gap-2">
          <ToggleLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('features')}</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">{t('notifications')}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="provider" className="space-y-4 mt-0">
        <ProviderTab initialSettings={currentSettings} />
      </TabsContent>

      <TabsContent value="general" className="space-y-4 mt-0">
        <GeneralSettingsTab initialSettings={currentSettings} />
      </TabsContent>

      <TabsContent value="features" className="space-y-4 mt-0">
        <FeaturesTab 
          initialSettings={currentSettings} 
          onFeaturesUpdate={onFeaturesUpdate}
        />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-4 mt-0">
        <NotificationsTab initialSettings={currentSettings} />
      </TabsContent>
    </Tabs>
  );
}