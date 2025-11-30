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

interface PostmarkFormProps {
  form: UseFormReturn<EmailSettingsFormData>;
}

export function PostmarkForm({ form }: PostmarkFormProps) {
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="mt-1">
          Get your Postmark Server API Token from{' '}
          <a 
            href="https://account.postmarkapp.com/servers" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline"
          >
            Postmark Servers
          </a>
          . Select your server and find the token in API Tokens.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="providerConfig.serverApiToken"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Server API Token *</FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  type={showToken ? 'text' : 'password'}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  {...field}
                  value={field.value as string || ''}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <FormDescription>
              Your Postmark Server API Token for authentication
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="providerConfig.messageStream"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Message Stream</FormLabel>
            <FormControl>
              <Input
                placeholder="outbound"
                {...field}
                value={(field.value as string) || 'outbound'}
              />
            </FormControl>
            <FormDescription>
              Message stream ID (default: outbound for transactional emails)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}