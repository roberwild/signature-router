'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import type { EmailProvider, ProviderConfig } from '../types';

const testEmailSchema = z.object({
  recipient: z.string().email('Please enter a valid email address')
});

// Helper function to safely convert unknown values to ReactNode for React rendering
const safeStringify = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return String(value);
  } catch {
    return '';
  }
};

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: EmailProvider;
  config: ProviderConfig;
  emailConfig: {
    from: string;
    fromName?: string;
    replyTo?: string;
  };
}

interface TestResult {
  type: 'connection' | 'email';
  success: boolean;
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export function TestEmailModal({
  isOpen,
  onClose,
  provider,
  config,
  emailConfig
}: TestEmailModalProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState('test');

  const form = useForm({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      recipient: ''
    }
  });

  const handleConnectionTest = async () => {
    setIsTesting(true);
    setActiveTab('results');

    try {
      const response = await fetch('/api/admin/email-settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config })
      });

      const result = await response.json();
      
      const testResult: TestResult = {
        type: 'connection',
        success: result.success,
        message: result.message || result.error || 'Connection test completed',
        timestamp: new Date(),
        details: result.details
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 4)]);

      if (result.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error(result.error || 'Connection test failed');
        if (result.suggestion) {
          toast.info(result.suggestion);
        }
      }
    } catch (_error: unknown) {
      const testResult: TestResult = {
        type: 'connection',
        success: false,
        message: 'Connection test failed: Network error',
        timestamp: new Date()
      };
      setTestResults(prev => [testResult, ...prev.slice(0, 4)]);
      toast.error('Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTest = async (data: { recipient: string }) => {
    setIsSending(true);
    setActiveTab('results');

    try {
      const response = await fetch('/api/admin/email-settings/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          config,
          recipient: data.recipient,
          emailConfig
        })
      });

      const result = await response.json();
      
      const testResult: TestResult = {
        type: 'email',
        success: result.success,
        message: result.message || result.error || 'Email test completed',
        timestamp: new Date(),
        details: {
          recipient: data.recipient,
          messageId: result.messageId,
          ...result.details
        }
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 4)]);

      if (result.success) {
        toast.success(`Test email sent to ${data.recipient}`);
        form.reset();
      } else {
        toast.error(result.error || 'Failed to send test email');
        if (result.suggestion) {
          toast.info(result.suggestion);
        }
      }
    } catch (_error: unknown) {
      const testResult: TestResult = {
        type: 'email',
        success: false,
        message: 'Email test failed: Network error',
        timestamp: new Date(),
        details: { recipient: data.recipient }
      };
      setTestResults(prev => [testResult, ...prev.slice(0, 4)]);
      toast.error('Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  const getResultIcon = (result: TestResult) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getResultBadge = (result: TestResult) => {
    return (
      <Badge variant={result.success ? 'default' : 'destructive'}>
        {result.type === 'connection' ? 'Connection' : 'Email'}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test Email Configuration</DialogTitle>
          <DialogDescription>
            Test your {provider} configuration and send a test email
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Tests</TabsTrigger>
            <TabsTrigger value="results">
              Results {testResults.length > 0 && `(${testResults.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4">
            {/* Connection Test Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Connection Test</h4>
              <p className="text-sm text-muted-foreground">
                Verify that your {provider} configuration is valid and can connect
              </p>
              <Button
                onClick={handleConnectionTest}
                disabled={isTesting}
                variant="outline"
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-4" />

            {/* Send Test Email Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Send Test Email</h4>
              <p className="text-sm text-muted-foreground">
                Send a test email to verify delivery
              </p>
              
              <form onSubmit={form.handleSubmit(handleSendTest)} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Email</Label>
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="test@example.com"
                    {...form.register('recipient')}
                    disabled={isSending}
                  />
                  {form.formState.errors.recipient && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.recipient.message}
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="mt-1">
                    A test email will be sent from <strong>{emailConfig.from}</strong> to the recipient address
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  disabled={isSending || !form.formState.isValid}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Test Email...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="results">
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No test results yet. Run a test to see results here.
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {getResultIcon(result)}
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {getResultBadge(result)}
                              <span className="text-xs text-muted-foreground">
                                {result.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{result.message}</p>
                            {result.details && (
                              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                {'recipient' in result.details && typeof result.details.recipient === 'string' && (
                                  <div>To: {result.details.recipient}</div>
                                )}
                                {'messageId' in result.details && typeof result.details.messageId === 'string' && (
                                  <div>ID: {result.details.messageId}</div>
                                )}
                                {'connectionTime' in result.details && result.details.connectionTime !== undefined && (
                                  <div>Time: {safeStringify(result.details.connectionTime)}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}