'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Bell, Mail, MessageSquare, FileText, UserPlus, Shield, AlertTriangle, BarChart3 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { FormProvider, FormField, FormItem, FormControl, FormDescription, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';

// Notifications schema
const notificationsSchema = z.object({
  notificationSettings: z.object({
    contactFormNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
    serviceRequestNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
    userRegistrationNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
    surveyCompletionNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
    failedLoginNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
    systemErrorNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  }),
});

type NotificationsFormData = z.infer<typeof notificationsSchema>;

import type { EmailSettingsFormData } from '../../types';

interface NotificationsTabProps {
  initialSettings?: EmailSettingsFormData & { id?: string };
}

export function NotificationsTab({ initialSettings }: NotificationsTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      notificationSettings: initialSettings?.notificationSettings || {
        contactFormNotificationEmail: '',
        serviceRequestNotificationEmail: '',
        userRegistrationNotificationEmail: '',
        surveyCompletionNotificationEmail: '',
        failedLoginNotificationEmail: '',
        systemErrorNotificationEmail: '',
      },
    }
  });

  const onSubmit = async (data: NotificationsFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/email-settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save notification settings');
      }

      toast.success('Notification settings saved successfully');
      form.reset(data); // Reset form with new values to clear dirty state
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save notification settings');
      console.error('Notification settings error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const contactFormEnabled = initialSettings?.features?.contactFormEmails;
  const serviceRequestEnabled = initialSettings?.features?.serviceRequestEmails;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Bell className="h-4 w-4" />
          <div>
            <AlertDescription className="ml-6 mt-1">
              Configure where notification emails should be sent when specific events occur in the system.
            </AlertDescription>
          </div>
        </Alert>

        {/* Business Operations Notifications */}
        <Card className="bg-card dark:bg-slate-900/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <CardTitle>Business Operations</CardTitle>
            </div>
            <CardDescription>
              Email notifications for customer interactions and service requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Form Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Contact Form Notifications</h4>
              </div>
              {!contactFormEnabled && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50">
                  <AlertDescription>
                    Contact form emails are disabled in Features tab. Enable them first.
                  </AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="notificationSettings.contactFormNotificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          disabled={!contactFormEnabled}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Where contact form notifications will be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service Request Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Service Request Notifications</h4>
              </div>
              {!serviceRequestEnabled && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50">
                  <AlertDescription>
                    Service request emails are disabled in Features tab. Enable them first.
                  </AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="notificationSettings.serviceRequestNotificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="services@example.com"
                          disabled={!serviceRequestEnabled}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Where service request notifications will be sent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Platform Activity Notifications */}
        <Card className="bg-card dark:bg-slate-900/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-500" />
              <CardTitle>Platform Activity</CardTitle>
            </div>
            <CardDescription>
              Notifications for user activity and engagement events
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {/* User Registration Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">User Registrations</h4>
              </div>
              <FormField
                control={form.control}
                name="notificationSettings.userRegistrationNotificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      New user registration alerts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Survey Completion Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Survey Completions</h4>
              </div>
              <FormField
                control={form.control}
                name="notificationSettings.surveyCompletionNotificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="assessments@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Cybersecurity assessment alerts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & System Alerts */}
        <Card className="bg-card dark:bg-slate-900/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle>Security & System Alerts</CardTitle>
            </div>
            <CardDescription>
              Critical security and technical notifications for administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {/* Failed Login Attempts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-500" />
                <h4 className="font-medium">Failed Login Attempts</h4>
              </div>
              <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50">
                <AlertDescription>
                  Critical alerts after 5 failed attempts
                </AlertDescription>
              </Alert>
              <FormField
                control={form.control}
                name="notificationSettings.failedLoginNotificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="security@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Security breach alerts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* System Error Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h4 className="font-medium">System Errors</h4>
              </div>
              <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-900/50">
                <AlertDescription>
                  Technical alerts with stack traces
                </AlertDescription>
              </Alert>
              <FormField
                control={form.control}
                name="notificationSettings.systemErrorNotificationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="tech@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      System error notifications
                    </FormDescription>
                    <FormMessage />
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
            Save Notification Settings
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}