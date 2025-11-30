'use client';

import { UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Info } from 'lucide-react';
import type { EmailSettingsFormData } from '../../types';

interface SendGridFormProps {
  form: UseFormReturn<EmailSettingsFormData>;
}

export function SendGridForm({ form }: SendGridFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="mt-1">
          Get your SendGrid API key from{' '}
          <a 
            href="https://app.sendgrid.com/settings/api_keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline"
          >
            SendGrid Settings
          </a>
          . Ensure you've verified your sender domain.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="providerConfig.apiKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Key *</FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  {...field}
                  value={field.value as string || ''}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <FormDescription>
              Your SendGrid API key with Mail Send permissions
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
              Optional: Your verified sender domain
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="providerConfig.ipPoolName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>IP Pool Name</FormLabel>
            <FormControl>
              <Input
                placeholder="transactional"
                {...field}
                value={field.value as string || ''}
              />
            </FormControl>
            <FormDescription>
              Optional: Specific IP pool for sending (Pro/Enterprise)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}