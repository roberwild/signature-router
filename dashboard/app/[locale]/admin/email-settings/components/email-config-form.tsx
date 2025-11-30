'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { Separator } from '@workspace/ui/components/separator';
import type { EmailSettingsFormData } from '../types';

interface EmailConfigFormProps {
  form: UseFormReturn<EmailSettingsFormData>;
}

export function EmailConfigForm({ form }: EmailConfigFormProps) {
  return (
    <div className="space-y-6">
      {/* Sender Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Sender Information</h3>
        
        <FormField
          control={form.control}
          name="emailFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Email *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="noreply@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The email address that will appear as the sender
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emailFromName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your Company Name"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The name that will appear as the sender (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Additional Email Addresses */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Additional Settings</h3>
        
        <FormField
          control={form.control}
          name="replyTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reply-To Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="support@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Where replies should be sent (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedbackInbox"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback Inbox</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="feedback@example.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Where in-app feedback should be sent (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Email Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Email Features</h3>
        <p className="text-sm text-muted-foreground">
          Control which types of emails the system can send
        </p>
        
        <div className="space-y-3">
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

          <FormField
            control={form.control}
            name="features.contactFormEmails"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-background dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Contact Form Emails</FormLabel>
                  <FormDescription>
                    Send notifications for contact form submissions
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
                    Send notifications for new service requests
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
      </div>
    </div>
  );
}