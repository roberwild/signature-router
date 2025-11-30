'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
// import { useTranslations } from '~/hooks/use-translations';
import { Loader2, Mail, MessageSquare, Reply, Info } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { FormProvider, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Separator } from '@workspace/ui/components/separator';

// General settings schema
const generalSettingsSchema = z.object({
  emailFrom: z.string().email('Must be a valid email address'),
  emailFromName: z.string().optional(),
  replyTo: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  feedbackInbox: z.string().email('Must be a valid email address').optional().or(z.literal('')),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

interface GeneralSettingsTabProps {
  initialSettings?: {
    emailFrom?: string;
    emailFromName?: string;
    replyTo?: string;
    feedbackInbox?: string;
  };
}

export function GeneralSettingsTab({ initialSettings }: GeneralSettingsTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      emailFrom: initialSettings?.emailFrom || '',
      emailFromName: initialSettings?.emailFromName || '',
      replyTo: initialSettings?.replyTo || '',
      feedbackInbox: initialSettings?.feedbackInbox || '',
    }
  });

  const onSubmit = async (data: GeneralSettingsFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/email-settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save general settings');
      }

      toast.success('General settings saved successfully');
      form.reset(data); // Reset form with new values to clear dirty state
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save general settings');
      console.error('General settings error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Email Settings</CardTitle>
            <CardDescription>
              Configure sender information and email addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sender Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Sender Information
              </h3>
              
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
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Reply className="h-4 w-4" />
                Additional Settings
              </h3>
              
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
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="feedback@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Where in-app feedback should be sent (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* SPF/DKIM Notice */}
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="mt-1">
            <strong>Important:</strong> After configuring your email settings, ensure you've set up proper SPF, DKIM, and DMARC records for your domain to improve email deliverability.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving || !form.formState.isDirty}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save General Settings
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}