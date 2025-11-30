'use client';

import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslations } from '~/hooks/use-translations';
import { Loader2, TestTube } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { FormProvider } from '@workspace/ui/components/form';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';

import { ProviderSelector } from '../provider-selector';
import { NodeMailerForm } from '../providers/nodemailer-form';
import { ResendForm } from '../providers/resend-form';
import { SendGridForm } from '../providers/sendgrid-form';
import { PostmarkForm } from '../providers/postmark-form';
import { TestEmailModal } from '../test-email-modal';
import { TestSavedEmailModal } from '../test-saved-email-modal';
import type { EmailProvider, ProviderConfig, NodeMailerConfig, ResendConfig, SendGridConfig, PostmarkConfig, EmailSettingsFormData } from '../../types';

// Provider configuration schema
const providerSchema = z.object({
  provider: z.enum(['nodemailer', 'resend', 'sendgrid', 'postmark']),
  providerConfig: z.record(z.string(), z.unknown()),
});

type ProviderFormData = z.infer<typeof providerSchema>;

// Helper function to safely convert ProviderConfig to Record<string, unknown>
function providerConfigToRecord(config: ProviderConfig): Record<string, unknown> {
  return config as Record<string, unknown>;
}

// Helper function to safely convert Record<string, unknown> to ProviderConfig
function recordToProviderConfig(record: Record<string, unknown>): ProviderConfig {
  return record as ProviderConfig;
}

interface ProviderTabProps {
  initialSettings?: EmailSettingsFormData & { id?: string };
}

function getDefaultProviderConfig(provider: EmailProvider): ProviderConfig {
  switch (provider) {
    case 'nodemailer':
      return { host: '', port: 587, secure: false } as NodeMailerConfig;
    case 'resend':
      return { apiKey: '' } as ResendConfig;
    case 'sendgrid':
      return { apiKey: '' } as SendGridConfig;
    case 'postmark':
      return { serverApiToken: '', messageStream: 'outbound' } as PostmarkConfig;
    default:
      return { host: '', port: 587, secure: false } as NodeMailerConfig;
  }
}

export function ProviderTab({ initialSettings }: ProviderTabProps) {
  const { t } = useTranslations('admin/email-settings.provider');
  const { t: tMessages } = useTranslations('admin/email-settings.provider.messages');
  const { t: _tCommon } = useTranslations('admin/email-settings.common');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSavedTestModalOpen, setIsSavedTestModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>(
    initialSettings?.provider || 'nodemailer'
  );

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      provider: initialSettings?.provider || 'nodemailer',
      providerConfig: providerConfigToRecord(initialSettings?.providerConfig || getDefaultProviderConfig('nodemailer')),
    }
  });

  const onProviderChange = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    form.setValue('provider', provider);
    const defaultConfig = getDefaultProviderConfig(provider);
    form.setValue('providerConfig', providerConfigToRecord(defaultConfig));
  };

  const onSubmit = async (data: ProviderFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/email-settings/provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.details) {
          interface ValidationError {
            path: string[];
            message: string;
          }
          const errorMessages = (result.details as ValidationError[]).map((err) =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          throw new Error(`${tMessages('validationError')}: ${errorMessages}`);
        }
        throw new Error(result.error || tMessages('saveError'));
      }

      toast.success(tMessages('saveSuccess'));
      form.reset(data); // Reset form with new values to clear dirty state
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : tMessages('saveError'));
      console.error('Provider settings error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = () => {
    if (initialSettings?.id) {
      setIsSavedTestModalOpen(true);
    } else {
      setIsTestModalOpen(true);
    }
  };

  const renderProviderForm = () => {
    // Type assertion is needed here because the form types are different
    // The provider forms expect EmailSettingsFormData but we have ProviderFormData
    const formWithProviderConfig = form as unknown as UseFormReturn<EmailSettingsFormData>;

    switch (selectedProvider) {
      case 'nodemailer':
        return <NodeMailerForm form={formWithProviderConfig} />;
      case 'resend':
        return <ResendForm form={formWithProviderConfig} />;
      case 'sendgrid':
        return <SendGridForm form={formWithProviderConfig} />;
      case 'postmark':
        return <PostmarkForm form={formWithProviderConfig} />;
      default:
        return null;
    }
  };

  return (
    <>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProviderSelector
                value={selectedProvider}
                onChange={onProviderChange}
              />

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4">{t('settings')}</h3>
                {renderProviderForm()}
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50">
            <TestTube className="h-4 w-4" />
            <AlertTitle className="ml-6 mt-1">{t('testConfiguration.title')}</AlertTitle>
            <AlertDescription className="mt-1">
              {t('testConfiguration.description')}
            </AlertDescription>
          </Alert>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
            >
              <TestTube className="mr-2 h-4 w-4" />
              {t('actions.testConnection')}
            </Button>

            <Button
              type="submit"
              disabled={isSaving || !form.formState.isDirty}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('actions.saveProviderSettings')}
            </Button>
          </div>
        </form>
      </FormProvider>

      <TestEmailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        provider={selectedProvider}
        config={recordToProviderConfig(form.getValues('providerConfig'))}
        emailConfig={{
          from: initialSettings?.emailFrom || 'test@example.com',
          fromName: initialSettings?.emailFromName || 'Test',
          replyTo: initialSettings?.replyTo || ''
        }}
      />

      <TestSavedEmailModal
        isOpen={isSavedTestModalOpen}
        onClose={() => setIsSavedTestModalOpen(false)}
        savedConfig={initialSettings ? {
          provider: initialSettings.provider,
          emailFrom: initialSettings.emailFrom || '',
          emailFromName: initialSettings.emailFromName || ''
        } : undefined}
      />
    </>
  );
}