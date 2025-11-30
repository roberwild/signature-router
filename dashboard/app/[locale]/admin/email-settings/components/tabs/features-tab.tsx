'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Users, Shield, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { FormProvider, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { Separator } from '@workspace/ui/components/separator';

// Features schema
const featuresSchema = z.object({
  features: z.object({
    welcomeEmails: z.boolean(),
    passwordResetEmails: z.boolean(),
    invitationEmails: z.boolean(),
    feedbackEmails: z.boolean(),
    leadQualificationEmails: z.boolean(),
    contactFormEmails: z.boolean(),
    serviceRequestEmails: z.boolean(),
    userRegistrationNotifications: z.boolean(),
    surveyCompletionNotifications: z.boolean(),
    failedLoginNotifications: z.boolean(),
    systemErrorNotifications: z.boolean(),
  }),
});

type FeaturesFormData = z.infer<typeof featuresSchema>;

import type { EmailSettingsFormData } from '../../types';

interface FeaturesTabProps {
  initialSettings?: EmailSettingsFormData & { id?: string };
  onFeaturesUpdate?: (features: Record<string, boolean>) => void;
}

export function FeaturesTab({ initialSettings, onFeaturesUpdate }: FeaturesTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FeaturesFormData>({
    resolver: zodResolver(featuresSchema),
    defaultValues: {
      features: initialSettings?.features || {
        welcomeEmails: true,
        passwordResetEmails: true,
        invitationEmails: true,
        feedbackEmails: true,
        leadQualificationEmails: true,
        contactFormEmails: false,
        serviceRequestEmails: false,
        userRegistrationNotifications: true,
        surveyCompletionNotifications: true,
        failedLoginNotifications: true,
        systemErrorNotifications: true,
      },
    }
  });

  const onSubmit = async (data: FeaturesFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/email-settings/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save feature settings');
      }

      toast.success('Feature settings saved successfully');
      form.reset(data); // Reset form with new values to clear dirty state
      // Update parent component state
      if (onFeaturesUpdate) {
        onFeaturesUpdate(data.features);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save feature settings');
      console.error('Feature settings error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAll = (enabled: boolean) => {
    const features = form.getValues('features');
    const updatedFeatures = Object.keys(features).reduce((acc, key) => {
      acc[key as keyof typeof features] = enabled;
      return acc;
    }, {} as typeof features);
    form.setValue('features', updatedFeatures, { shouldDirty: true });
  };

  const handleToggleSection = (enabled: boolean, sectionKeys: string[]) => {
    const currentFeatures = form.getValues('features');
    const updatedFeatures = { ...currentFeatures };
    
    sectionKeys.forEach(key => {
      if (key in updatedFeatures) {
        (updatedFeatures as Record<string, boolean>)[key] = enabled;
      }
    });
    
    form.setValue('features', updatedFeatures, { shouldDirty: true });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Email Features</CardTitle>
                <CardDescription>
                  Control which types of emails the system can send. Features are organized by recipient type.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAll(true)}
                >
                  Enable All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAll(false)}
                >
                  Disable All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Emails */}
            <div className="space-y-3 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">User Emails</h3>
                    <p className="text-xs text-muted-foreground">Emails sent directly to your users</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSection(true, ['welcomeEmails', 'passwordResetEmails', 'invitationEmails'])}
                    className="text-xs"
                  >
                    Enable All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSection(false, ['welcomeEmails', 'passwordResetEmails', 'invitationEmails'])}
                    className="text-xs"
                  >
                    Disable All
                  </Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="features.welcomeEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Welcome Emails</FormLabel>
                      <FormDescription>
                        Send welcome emails to new users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.passwordResetEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Password Reset Emails</FormLabel>
                      <FormDescription>
                        Allow users to reset their passwords via email
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.invitationEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Invitation Emails</FormLabel>
                      <FormDescription>
                        Send invitation emails to new team members
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Admin Notifications */}
            <div className="space-y-3 p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin Notifications</h3>
                    <p className="text-xs text-muted-foreground">Internal alerts sent to administrators</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSection(true, ['feedbackEmails', 'contactFormEmails', 'serviceRequestEmails', 'userRegistrationNotifications', 'surveyCompletionNotifications', 'failedLoginNotifications', 'systemErrorNotifications'])}
                    className="text-xs"
                  >
                    Enable All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSection(false, ['feedbackEmails', 'contactFormEmails', 'serviceRequestEmails', 'userRegistrationNotifications', 'surveyCompletionNotifications', 'failedLoginNotifications', 'systemErrorNotifications'])}
                    className="text-xs"
                  >
                    Disable All
                  </Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="features.feedbackEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Feedback Emails</FormLabel>
                      <FormDescription>
                        Forward user feedback to the feedback inbox
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.contactFormEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Contact Form Emails</FormLabel>
                      <FormDescription>
                        Send email alerts when contact forms are submitted
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.serviceRequestEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Service Request Emails</FormLabel>
                      <FormDescription>
                        Send email alerts when service requests are submitted
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.userRegistrationNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">User Registration Notifications</FormLabel>
                      <FormDescription>
                        Get notified when new users sign up to the platform
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.surveyCompletionNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Survey Completion Notifications</FormLabel>
                      <FormDescription>
                        Get notified when users complete cybersecurity assessments
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.failedLoginNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Failed Login Notifications</FormLabel>
                      <FormDescription>
                        Receive security alerts for multiple failed login attempts (critical)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="features.systemErrorNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">System Error Notifications</FormLabel>
                      <FormDescription>
                        Receive alerts when critical system errors occur (technical)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Marketing & Engagement */}
            <div className="space-y-3 p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Marketing & Engagement</h3>
                    <p className="text-xs text-muted-foreground">Lead generation and business growth emails</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSection(true, ['leadQualificationEmails'])}
                    className="text-xs"
                  >
                    Enable All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSection(false, ['leadQualificationEmails'])}
                    className="text-xs"
                  >
                    Disable All
                  </Button>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="features.leadQualificationEmails"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Lead Qualification Emails</FormLabel>
                      <FormDescription>
                        Send notifications about new qualified leads
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving || !form.formState.isDirty}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Feature Settings
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}