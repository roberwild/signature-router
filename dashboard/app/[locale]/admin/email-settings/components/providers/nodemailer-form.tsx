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
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Info } from 'lucide-react';
import type { EmailSettingsFormData } from '../../types';

interface NodeMailerFormProps {
  form: UseFormReturn<EmailSettingsFormData>;
}

export function NodeMailerForm({ form }: NodeMailerFormProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="mt-1">
          NodeMailer supports any SMTP server. For Gmail, use smtp.gmail.com with port 587 and an app-specific password.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="providerConfig.host"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SMTP Host *</FormLabel>
            <FormControl>
              <Input
                placeholder="smtp.gmail.com"
                {...field}
                value={field.value as string || ''}
              />
            </FormControl>
            <FormDescription>
              Your SMTP server hostname
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="providerConfig.port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Port *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="587"
                  {...field}
                  value={field.value as number || 587}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Common: 587 (TLS), 465 (SSL), 25 (unencrypted)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="providerConfig.secure"
          render={({ field }) => (
            <FormItem className="flex flex-col justify-between">
              <div>
                <FormLabel>Secure Connection</FormLabel>
                <FormDescription>
                  Use SSL/TLS encryption
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={(field.value as boolean) || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-sm font-medium">Authentication (Optional)</h4>
        
        <FormField
          control={form.control}
          name="providerConfig.auth.user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="user@example.com"
                  {...field}
                  value={field.value as string || ''}
                />
              </FormControl>
              <FormDescription>
                SMTP authentication username (usually your email)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="providerConfig.auth.pass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  {...field}
                  value={field.value as string || ''}
                />
              </FormControl>
              <FormDescription>
                SMTP authentication password or app-specific password
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="providerConfig.tls.rejectUnauthorized"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Reject Unauthorized Certificates</FormLabel>
              <FormDescription>
                Recommended for production (disable only for self-signed certs)
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={(field.value as boolean) !== false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}