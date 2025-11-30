'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Send, Mail, CheckCircle, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import type { EmailProvider } from '../types';

const testEmailSchema = z.object({
  recipient: z.string().email('Please enter a valid email address')
});


interface TestSavedEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedConfig?: {
    provider: EmailProvider;
    emailFrom: string;
    emailFromName?: string;
  };
}

export function TestSavedEmailModal({
  isOpen,
  onClose,
  savedConfig
}: TestSavedEmailModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);

  const form = useForm({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      recipient: ''
    }
  });

  const handleSendTest = async (data: { recipient: string }) => {
    setIsSending(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/email-settings/send-test-saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: data.recipient
        })
      });

      const result = await response.json();
      
      setTestResult({
        success: result.success,
        message: result.message || result.error || 'Test completed',
        details: result.details
      });

      if (result.success) {
        toast.success(`Test email sent to ${data.recipient}`);
      } else {
        toast.error(result.error || 'Failed to send test email');
        if (result.suggestion) {
          toast.info(result.suggestion);
        }
      }
    } catch (_error: unknown) {
      setTestResult({
        success: false,
        message: 'Failed to send test email: Network error',
        details: { recipient: data.recipient }
      });
      toast.error('Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setTestResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email using your saved configuration to verify everything is working correctly.
          </DialogDescription>
        </DialogHeader>

        {savedConfig && (
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Provider:</span>
              <Badge variant="secondary" className="text-xs">
                {savedConfig.provider}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">From:</span>
              <span className="font-mono text-xs">
                {savedConfig.emailFromName ? 
                  `${savedConfig.emailFromName} <${savedConfig.emailFrom}>` : 
                  savedConfig.emailFrom}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSendTest)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">
              Recipient Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="recipient"
                type="email"
                placeholder="your-email@example.com"
                className="pl-10"
                {...form.register('recipient')}
                disabled={isSending}
              />
            </div>
            {form.formState.errors.recipient && (
              <p className="text-sm text-red-600">
                {form.formState.errors.recipient.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the email address where you want to receive the test email
            </p>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <div>
                <AlertTitle className="ml-6 mt-1">
                  {testResult.success ? 'Success' : 'Failed'}
                </AlertTitle>
                <AlertDescription className="mt-1">
                  {testResult.message}
                  {testResult.details &&
                   typeof testResult.details === 'object' &&
                   testResult.details !== null &&
                   'subject' in testResult.details &&
                   typeof testResult.details.subject === 'string' && (
                    <div className="mt-2 text-xs">
                      Subject: {testResult.details.subject}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending || !form.formState.isValid}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}