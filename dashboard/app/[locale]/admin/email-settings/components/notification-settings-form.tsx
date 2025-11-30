'use client';

import { UseFormReturn } from 'react-hook-form';
import { Bell, Mail, MessageSquare, FileText } from 'lucide-react';
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';

import type { EmailSettingsFormData } from '../types';

interface NotificationSettingsFormProps {
  form: UseFormReturn<EmailSettingsFormData>;
}

export function NotificationSettingsForm({ form }: NotificationSettingsFormProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription className="mt-1">
          Configure which events trigger email notifications and where they should be sent.
        </AlertDescription>
      </Alert>

      {/* Contact Form Notifications */}
      <Card className="bg-card dark:bg-slate-900/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Contact Form Submissions</CardTitle>
          </div>
          <CardDescription>
            Receive email notifications when users submit the contact form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="features.contactFormEmails"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Enable Contact Form Notifications
                  </FormLabel>
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
          
          {form.watch('features.contactFormEmails') && (
            <FormField
              control={form.control}
              name="notificationSettings.contactFormNotificationEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notification Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="admin@mineryreport.com"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Email address where contact form notifications will be sent
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Service Request Notifications */}
      <Card className="bg-card dark:bg-slate-900/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Service Requests</CardTitle>
          </div>
          <CardDescription>
            Receive email notifications when users request services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="features.serviceRequestEmails"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Enable Service Request Notifications
                  </FormLabel>
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
          
          {form.watch('features.serviceRequestEmails') && (
            <FormField
              control={form.control}
              name="notificationSettings.serviceRequestNotificationEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notification Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="services@mineryreport.com"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Email address where service request notifications will be sent
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}