'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { Slider } from '@workspace/ui/components/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  FormProvider,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { 
  Save,
  RotateCcw,
  Clock,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import type { GlobalSettingsConfig } from '~/data/admin/questionnaires/get-global-settings';

const settingsSchema = z.object({
  maxQuestionsPerSession: z.number().min(1).max(10),
  snoozeDurationOptions: z.array(z.string()).min(1),
  permanentDismissThreshold: z.number().min(1).max(10),
  defaultChannel: z.string(),
  questionTimeoutMinutes: z.number().min(1).max(30),
  sessionTimeoutMinutes: z.number().min(5).max(120)
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface GlobalSettingsManagerProps {
  initialSettings: GlobalSettingsConfig;
  locale: string;
}

const channelOptions = [
  { value: 'platform', label: 'Platform', description: 'In-app questionnaires' },
  { value: 'email', label: 'Email', description: 'Email invitations' },
  { value: 'whatsapp', label: 'WhatsApp', description: 'WhatsApp messages' }
];

const defaultSnoozeOptions = ['15m', '1h', '4h', '1d', '3d', '1w', '2w'];

export function GlobalSettingsManager({ initialSettings, locale: _locale }: GlobalSettingsManagerProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customSnoozeOption, setCustomSnoozeOption] = useState('');

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      maxQuestionsPerSession: initialSettings.maxQuestionsPerSession,
      snoozeDurationOptions: initialSettings.snoozeDurationOptions,
      permanentDismissThreshold: initialSettings.permanentDismissThreshold,
      defaultChannel: initialSettings.defaultChannel,
      questionTimeoutMinutes: initialSettings.questionTimeoutMinutes,
      sessionTimeoutMinutes: initialSettings.sessionTimeoutMinutes
    },
    mode: 'onChange'
  });

  const watchedValues = form.watch();

  // Check if form has changes
  useEffect(() => {
    const hasFormChanges = JSON.stringify(watchedValues) !== JSON.stringify(initialSettings);
    setHasChanges(hasFormChanges);
  }, [watchedValues, initialSettings]);

  const handleSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/questionnaires/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to their default values?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/questionnaires/settings/reset', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to reset settings');

      const defaultSettings = await response.json();
      form.reset(defaultSettings.data);
      toast.success('Settings reset to defaults');
    } catch (error) {
      toast.error('Failed to reset settings');
      console.error(error);
    }
  };

  const addSnoozeOption = () => {
    if (!customSnoozeOption.trim()) return;
    
    const currentOptions = form.getValues('snoozeDurationOptions');
    if (currentOptions.includes(customSnoozeOption)) {
      toast.error('Duration option already exists');
      return;
    }
    
    form.setValue('snoozeDurationOptions', [...currentOptions, customSnoozeOption]);
    setCustomSnoozeOption('');
  };

  const removeSnoozeOption = (option: string) => {
    const currentOptions = form.getValues('snoozeDurationOptions');
    form.setValue('snoozeDurationOptions', currentOptions.filter(o => o !== option));
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <div>
            <AlertTitle className="ml-6 mt-1">Unsaved Changes</AlertTitle>
            <AlertDescription className="mt-1">
              You have unsaved changes. Make sure to save before leaving this page.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Session Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Session Configuration
              </CardTitle>
              <CardDescription>
                Control how questionnaire sessions are structured and managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="maxQuestionsPerSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questions Per Session</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={1}
                          max={5}
                          step={1}
                          className="w-full max-w-md"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{field.value} questions</Badge>
                          <span className="text-sm text-muted-foreground">
                            per session
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Maximum number of questions to ask in a single session. 
                      Lower values reduce cognitive load but require more sessions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessionTimeoutMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Timeout</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={5}
                          max={60}
                          step={5}
                          className="w-full max-w-md"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{field.value} minutes</Badge>
                          <span className="text-sm text-muted-foreground">
                            to complete
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Time allowed for completing a questionnaire session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionTimeoutMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Timeout</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={1}
                          max={15}
                          step={1}
                          className="w-full max-w-md"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{field.value} minutes</Badge>
                          <span className="text-sm text-muted-foreground">
                            per question
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Time limit for answering individual questions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* User Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                User Experience
              </CardTitle>
              <CardDescription>
                Configure how users can interact with questionnaires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="snoozeDurationOptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Snooze Duration Options</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((option) => (
                            <Badge
                              key={option}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {option}
                              <button
                                type="button"
                                onClick={() => removeSnoozeOption(option)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., 2h, 5d"
                            value={customSnoozeOption}
                            onChange={(e) => setCustomSnoozeOption(e.target.value)}
                            className="max-w-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addSnoozeOption}
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Suggested: {defaultSnoozeOptions.filter(opt => !field.value.includes(opt)).slice(0, 3).join(', ')}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Duration options users can choose when snoozing questionnaires
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permanentDismissThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Dismiss Threshold</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full max-w-md"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{field.value} dismissals</Badge>
                          <span className="text-sm text-muted-foreground">
                            before permanent stop
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Number of times a user can dismiss questionnaires before being permanently excluded
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Channel Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Default Channel
              </CardTitle>
              <CardDescription>
                Set the default delivery channel for questionnaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="defaultChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Delivery Channel</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="max-w-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {channelOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Primary channel used for sending questionnaires when no specific channel is configured
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToDefaults}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </FormProvider>

      {/* Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Questions per session:</span>
              <Badge variant="outline">{watchedValues.maxQuestionsPerSession}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session timeout:</span>
              <Badge variant="outline">{watchedValues.sessionTimeoutMinutes}m</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Question timeout:</span>
              <Badge variant="outline">{watchedValues.questionTimeoutMinutes}m</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dismiss threshold:</span>
              <Badge variant="outline">{watchedValues.permanentDismissThreshold}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Default channel:</span>
              <Badge variant="outline">{watchedValues.defaultChannel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Snooze options:</span>
              <Badge variant="outline">{watchedValues.snoozeDurationOptions.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}