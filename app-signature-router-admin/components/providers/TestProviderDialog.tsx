"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, TestTube } from "lucide-react";
import { getApiClient } from "@/lib/api/client";

interface Provider {
  id: string;
  provider_name: string;
  provider_type: string;
}

interface TestProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Provider | null;
}

export function TestProviderDialog({ open, onOpenChange, provider }: TestProviderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testDestination, setTestDestination] = useState("");
  const [testMessage, setTestMessage] = useState("Test message from Signature Router Admin");

  const apiClient = getApiClient();

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    if (!provider) return;

    setLoading(true);
    setTestResult(null);

    try {
      const result = await apiClient.testProvider(provider.id, {
        test_destination: testDestination,
        test_message: testMessage,
      });

      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: "Test failed",
        error_details: error.message || "Unknown error",
        response_time_ms: 0,
        tested_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  function getPlaceholder() {
    if (!provider) return "";
    
    switch (provider.provider_type) {
      case "SMS":
      case "VOICE":
        return "+1234567890";
      case "PUSH":
        return "FCM token or device ID";
      case "BIOMETRIC":
        return "User ID or device ID";
      default:
        return "Test destination";
    }
  }

  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Provider
          </DialogTitle>
          <DialogDescription>
            Test connectivity and configuration for {provider.provider_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTest} className="space-y-4">
          {/* Test Destination */}
          <div className="space-y-2">
            <Label htmlFor="test_destination">
              Test Destination * 
              <span className="text-xs text-muted-foreground ml-2">
                ({provider.provider_type === "SMS" || provider.provider_type === "VOICE" ? "Phone Number" : "Token/ID"})
              </span>
            </Label>
            <Input
              id="test_destination"
              value={testDestination}
              onChange={(e) => setTestDestination(e.target.value)}
              placeholder={getPlaceholder()}
              required
            />
          </div>

          {/* Test Message */}
          <div className="space-y-2">
            <Label htmlFor="test_message">Test Message (Optional)</Label>
            <Textarea
              id="test_message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              placeholder="Test message content"
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                    {testResult.message}
                  </p>
                  {testResult.success && (
                    <p className="text-sm text-green-700">
                      Response time: {testResult.response_time_ms}ms
                    </p>
                  )}
                  {!testResult.success && testResult.error_details && (
                    <p className="text-sm text-red-700">
                      {testResult.error_details}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Tested at: {new Date(testResult.tested_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

