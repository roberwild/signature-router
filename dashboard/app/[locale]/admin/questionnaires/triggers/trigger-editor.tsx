'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';
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
import { Slider } from '@workspace/ui/components/slider';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { 
  Save,
  X,
  Clock,
  Eye,
  MousePointer,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import type { BehavioralTrigger } from '~/data/admin/questionnaires/get-behavioral-triggers';

const triggerSchema = z.object({
  triggerName: z.string().min(1, 'Trigger name is required'),
  triggerType: z.enum(['page_view', 'action', 'time_based', 'score_based']),
  delayHours: z.number().min(0).max(720),
  enabled: z.boolean(),
  conditions: z.record(z.string(), z.unknown())
});

type TriggerFormData = z.infer<typeof triggerSchema>;

interface TriggerEditorProps {
  trigger: BehavioralTrigger | null;
  isCreateMode: boolean;
  onSave: (trigger: BehavioralTrigger) => void;
  onCancel: () => void;
}

const triggerTypeOptions = [
  { value: 'page_view', label: 'Page View', icon: Eye, description: 'Triggered when lead visits specific pages' },
  { value: 'action', label: 'User Action', icon: MousePointer, description: 'Triggered by specific user actions' },
  { value: 'time_based', label: 'Time-based', icon: Clock, description: 'Triggered after a certain time period' },
  { value: 'score_based', label: 'Score-based', icon: Star, description: 'Triggered when lead reaches score threshold' }
];

// Sample questions for selection (would come from API in real app)
const availableQuestions = [
  { id: 'budget_range', text: 'What is your cybersecurity budget range?' },
  { id: 'decision_timeline', text: 'When do you plan to make a decision?' },
  { id: 'team_size', text: 'How large is your security team?' },
  { id: 'current_tools', text: 'What security tools do you currently use?' },
  { id: 'main_challenges', text: 'What are your main security challenges?' }
];

export function TriggerEditor({ trigger, isCreateMode, onSave, onCancel }: TriggerEditorProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(
    trigger?.questionIds || []
  );
  const [saving, setSaving] = useState(false);

  const form = useForm<TriggerFormData>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      triggerName: trigger?.triggerName || '',
      triggerType: (trigger?.triggerType as 'page_view' | 'action' | 'time_based' | 'score_based') || 'page_view',
      delayHours: trigger?.delayHours || 0,
      enabled: trigger?.enabled ?? true,
      conditions: trigger?.triggerConditions || {}
    }
  });

  const watchedType = form.watch('triggerType');

  const handleSubmit = async (data: TriggerFormData) => {
    setSaving(true);
    
    try {
      const payload = {
        triggerName: data.triggerName,
        triggerType: data.triggerType,
        triggerConditions: data.conditions,
        delayHours: data.delayHours,
        enabled: data.enabled,
        questionIds: selectedQuestions
      };

      const url = isCreateMode 
        ? '/api/admin/questionnaires/triggers'
        : `/api/admin/questionnaires/triggers/${trigger!.id}`;
      
      const response = await fetch(url, {
        method: isCreateMode ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save trigger');

      const savedTrigger = await response.json();
      onSave(savedTrigger.data);
      toast.success(`Trigger ${isCreateMode ? 'created' : 'updated'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${isCreateMode ? 'create' : 'update'} trigger`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderConditionsForm = () => {
    switch (watchedType) {
      case 'page_view':
        return (
          <FormField
            control={form.control}
            name="conditions.page"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Path</FormLabel>
                <FormControl>
                  <Input placeholder="/pricing" value={field.value as string || ''} onChange={field.onChange} />
                </FormControl>
                <FormDescription>
                  The page path that triggers this questionnaire (e.g., /pricing, /demo)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'action':
        return (
          <FormField
            control={form.control}
            name="conditions.action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Action Type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value as string || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment_completed">Assessment Completed</SelectItem>
                      <SelectItem value="demo_requested">Demo Requested</SelectItem>
                      <SelectItem value="whitepaper_downloaded">Whitepaper Downloaded</SelectItem>
                      <SelectItem value="contact_form_submitted">Contact Form Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  The specific action that triggers this questionnaire
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'time_based':
        return (
          <FormField
            control={form.control}
            name="conditions.days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Days Since Registration</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Slider
                      value={[Number(field.value) || 0]}
                      onValueChange={([value]) => field.onChange(value)}
                      min={0}
                      max={30}
                      step={1}
                    />
                    <div className="text-sm text-muted-foreground">
                      {Number(field.value) || 0} days
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Trigger after this many days since lead registration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'score_based':
        return (
          <FormField
            control={form.control}
            name="conditions.min_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Score</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Slider
                      value={[Number(field.value) || 0]}
                      onValueChange={([value]) => field.onChange(value)}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <div className="text-sm text-muted-foreground">
                      {Number(field.value) || 0} points
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Trigger when lead reaches this score threshold
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[60vh] px-1">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="triggerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Name</FormLabel>
                    <FormControl>
                      <Input placeholder="High engagement follow-up" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this trigger
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="triggerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerTypeOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {option.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Trigger Conditions */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Trigger Conditions</h4>
              {renderConditionsForm()}
            </div>

            {/* Delay Settings */}
            <FormField
              control={form.control}
              name="delayHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delay (Hours)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[field.value]}
                        onValueChange={([value]) => field.onChange(value)}
                        min={0}
                        max={72}
                        step={1}
                      />
                      <div className="text-sm text-muted-foreground">
                        {field.value === 0 ? 'Immediate' : `${field.value} hours delay`}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    How long to wait after the trigger condition is met
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question Selection */}
            <div className="space-y-4">
              <Label>Questions to Send</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {availableQuestions.map((question) => (
                  <div key={question.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={question.id}
                      checked={selectedQuestions.includes(question.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions(prev => [...prev, question.id]);
                        } else {
                          setSelectedQuestions(prev => prev.filter(id => id !== question.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <label htmlFor={question.id} className="text-sm flex-1">
                      {question.text}
                    </label>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Selected: {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Enable/Disable */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Enable Trigger</FormLabel>
                    <FormDescription>
                      Whether this trigger should be active
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
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || selectedQuestions.length === 0}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : (isCreateMode ? 'Create' : 'Update')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}