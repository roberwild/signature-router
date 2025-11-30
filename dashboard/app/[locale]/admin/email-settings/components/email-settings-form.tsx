'use client';

import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { FormProvider } from '@workspace/ui/components/form';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';

import { ProviderSelector } from './provider-selector';
import { EmailConfigForm } from './email-config-form';
import { NodeMailerForm } from './providers/nodemailer-form';
import { ResendForm } from './providers/resend-form';
import { SendGridForm } from './providers/sendgrid-form';
import { TestEmailModal } from './test-email-modal';
import { TestSavedEmailModal } from './test-saved-email-modal';
import { NotificationSettingsForm } from './notification-settings-form';
import { emailSettingsSchema } from '../schemas/email-settings-schema';
import type { EmailProvider, EmailSettingsFormData, ProviderConfig, NodeMailerConfig, ResendConfig, SendGridConfig } from '../types';

interface EmailSettingsFormProps {
  initialSettings?: EmailSettingsFormData & { id?: string };
}

// Helper function to get default provider config
function getDefaultProviderConfig(provider: EmailProvider): ProviderConfig {
  switch (provider) {
    case 'nodemailer':
      return { host: '', port: 587, secure: false } as NodeMailerConfig;
    case 'resend':
      return { apiKey: '' } as ResendConfig;
    case 'sendgrid':
      return { apiKey: '' } as SendGridConfig;
    default:
      return { host: '', port: 587, secure: false } as NodeMailerConfig;
  }
}

export function EmailSettingsForm({ initialSettings }: EmailSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [_isTesting, _setIsTesting] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSavedTestModalOpen, setIsSavedTestModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider>(
    initialSettings?.provider || 'nodemailer'
  );

  const form: UseFormReturn<EmailSettingsFormData> = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      provider: initialSettings?.provider || 'nodemailer',
      emailFrom: initialSettings?.emailFrom || '',
      emailFromName: initialSettings?.emailFromName || '',
      feedbackInbox: initialSettings?.feedbackInbox || '',
      replyTo: initialSettings?.replyTo || '',
      providerConfig: initialSettings?.providerConfig || getDefaultProviderConfig('nodemailer'),
      features: initialSettings?.features || {
        welcomeEmails: true,
        passwordResetEmails: true,
        invitationEmails: true,
        feedbackEmails: true,
        leadQualificationEmails: true,
        contactFormEmails: false,
        serviceRequestEmails: false,
      },
      notificationSettings: initialSettings?.notificationSettings || {
        contactFormNotificationEmail: '',
        serviceRequestNotificationEmail: '',
      }
    }
  });

  const onProviderChange = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    form.setValue('provider', provider);
    // Reset provider config when switching - set a valid default config
    const defaultConfig = getDefaultProviderConfig(provider);
    form.setValue('providerConfig', defaultConfig);
  };

  const onSubmit = async (data: EmailSettingsFormData) => {
    setIsSaving(true);
    try {
      console.log('Submitting email settings:', data);

      const response = await fetch('/api/admin/email-settings', {
        method: initialSettings?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError as Error);
        throw new Error('Invalid response from server');
      }
      console.log('API Response:', { status: response.status, result });

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.details) {
          interface ValidationError {
            path: string[];
            message: string;
          }
          const errorMessages = (result.details as ValidationError[]).map((err) =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        throw new Error(result.error || 'Failed to save email settings');
      }

      toast.success('Email settings saved successfully');
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save email settings';
      toast.error(errorMessage);
      console.error('Email settings error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTestModal = () => {
    // If we have saved settings, use the simplified test modal
    if (initialSettings?.id) {
      setIsSavedTestModalOpen(true);
    } else {
      // Otherwise, use the original test modal that requires configuration
      const formData = form.getValues();
      if (!formData.emailFrom) {
        toast.error('Please enter a From Email address first');
        return;
      }
      setIsTestModalOpen(true);
    }
  };

  const renderProviderForm = () => {
    switch (selectedProvider) {
      case 'nodemailer':
        return <NodeMailerForm form={form} />;
      case 'resend':
        return <ResendForm form={form} />;
      case 'sendgrid':
        return <SendGridForm form={form} />;
      default:
        return null;
    }
  };

  return (
    <>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>
                Select and configure your email service provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderSelector
                value={selectedProvider}
                onChange={onProviderChange}
              />
            </CardContent>
          </Card>

          {/* Provider Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Configuration</CardTitle>
              <CardDescription>
                Configure your {selectedProvider} settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderProviderForm()}
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure sender information and email addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailConfigForm form={form} />
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email notifications for different events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettingsForm form={form} />
            </CardContent>
          </Card>

          {/* SPF/DKIM Notice */}
          <Alert>
            <AlertDescription className="mt-1">
              <strong>Important:</strong> After configuring your email settings, ensure you've set up proper SPF, DKIM, and DMARC records for your domain to improve email deliverability.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenTestModal}
              disabled={!initialSettings?.id && !form.formState.isValid}
            >
              Test Configuration
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>

      {/* Test Email Modal - for unsaved configurations */}
      <TestEmailModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        provider={selectedProvider}
        config={form.getValues('providerConfig')}
        emailConfig={{
          from: form.getValues('emailFrom'),
          fromName: form.getValues('emailFromName'),
          replyTo: form.getValues('replyTo')
        }}
      />

      {/* Test Saved Email Modal - for saved configurations */}
      <TestSavedEmailModal
        isOpen={isSavedTestModalOpen}
        onClose={() => setIsSavedTestModalOpen(false)}
        savedConfig={initialSettings ? {
          provider: initialSettings.provider,
          emailFrom: initialSettings.emailFrom,
          emailFromName: initialSettings.emailFromName
        } : undefined}
      />
    </>
  );
}