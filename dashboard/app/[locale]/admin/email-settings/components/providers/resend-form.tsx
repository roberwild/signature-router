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
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Info } from 'lucide-react';
import { MaskedInput } from '~/components/ui/masked-input';
import type { EmailSettingsFormData } from '../../types';

interface ResendFormProps {
  form: UseFormReturn<EmailSettingsFormData>;
}

export function ResendForm({ form }: ResendFormProps) {
  // Check if this is existing data (has been saved before)
  const currentApiKey = form.getValues('providerConfig.apiKey') as string;
  const isExistingApiKey = currentApiKey && currentApiKey.includes('*');

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="mt-1">
          Get your Resend API key from{' '}
          <a 
            href="https://resend.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline"
          >
            resend.com/api-keys
          </a>
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="providerConfig.apiKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Key *</FormLabel>
            <FormControl>
              <MaskedInput
                maskingType="api-key"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={(field.value as string) || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                isNewValue={!isExistingApiKey}
              />
            </FormControl>
            <FormDescription>
              Your Resend API key for authentication
              {isExistingApiKey && (
                <span className="block text-amber-600 text-xs mt-1">
                  API key is encrypted and masked. Click the eye icon or focus to update.
                </span>
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="providerConfig.fromDomain"
        render={({ field }) => (
          <FormItem>
            <FormLabel>From Domain</FormLabel>
            <FormControl>
              <Input
                placeholder="example.com"
                {...field}
                value={field.value as string || ''}
              />
            </FormControl>
            <FormDescription>
              Optional: Restrict sending to a specific domain
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}