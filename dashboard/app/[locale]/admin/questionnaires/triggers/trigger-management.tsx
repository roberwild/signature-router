'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Switch } from '@workspace/ui/components/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import {
  Plus,
  Settings,
  Trash2,
  Eye,
  Clock,
  Zap,
  Target,
  MousePointer,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { TriggerEditor } from './trigger-editor';
import type { BehavioralTrigger } from '~/data/admin/questionnaires/get-behavioral-triggers';

interface TriggerManagementProps {
  initialTriggers: BehavioralTrigger[];
  locale: string;
}

const triggerTypeIcons = {
  page_view: Eye,
  action: MousePointer,
  time_based: Clock,
  score_based: Star
};

const triggerTypeLabels = {
  page_view: 'Page View',
  action: 'User Action',
  time_based: 'Time-based',
  score_based: 'Score-based'
};

export function TriggerManagement({ initialTriggers, locale: _locale }: TriggerManagementProps) {
  const [triggers, setTriggers] = useState<BehavioralTrigger[]>(initialTriggers);
  const [selectedTrigger, setSelectedTrigger] = useState<BehavioralTrigger | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const handleCreateTrigger = () => {
    setSelectedTrigger(null);
    setIsCreateMode(true);
    setIsEditorOpen(true);
  };

  const handleEditTrigger = (trigger: BehavioralTrigger) => {
    setSelectedTrigger(trigger);
    setIsCreateMode(false);
    setIsEditorOpen(true);
  };

  const handleToggleEnabled = async (triggerId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/questionnaires/triggers/${triggerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) throw new Error('Failed to update trigger');

      setTriggers(prev => prev.map(t => 
        t.id === triggerId ? { ...t, enabled } : t
      ));

      toast.success(`Trigger ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update trigger');
      console.error(error);
    }
  };

  const handleDeleteTrigger = async (triggerId: string, triggerName: string) => {
    if (!confirm(`Are you sure you want to delete the trigger "${triggerName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/questionnaires/triggers/${triggerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete trigger');

      setTriggers(prev => prev.filter(t => t.id !== triggerId));
      toast.success('Trigger deleted successfully');
    } catch (error) {
      toast.error('Failed to delete trigger');
      console.error(error);
    }
  };

  const handleTriggerSaved = (savedTrigger: BehavioralTrigger) => {
    if (isCreateMode) {
      setTriggers(prev => [...prev, savedTrigger]);
    } else {
      setTriggers(prev => prev.map(t => 
        t.id === savedTrigger.id ? savedTrigger : t
      ));
    }
    setIsEditorOpen(false);
  };

  const formatConditions = (conditions: Record<string, unknown>, type: string) => {
    switch (type) {
      case 'page_view':
        return `Page: ${conditions.page || 'Any'}`;
      case 'action':
        return `Action: ${conditions.action || 'Any'}`;
      case 'time_based':
        return `After: ${conditions.days || 0} days`;
      case 'score_based':
        return `Min Score: ${conditions.min_score || 0}`;
      default:
        return 'Custom conditions';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Available Triggers</h2>
          <p className="text-sm text-muted-foreground">
            {triggers.length} trigger{triggers.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={handleCreateTrigger}>
          <Plus className="mr-2 h-4 w-4" />
          Add Trigger
        </Button>
      </div>

      {/* Triggers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {triggers.map((trigger) => {
          const TypeIcon = triggerTypeIcons[trigger.triggerType as keyof typeof triggerTypeIcons] || Target;
          const typeLabel = triggerTypeLabels[trigger.triggerType as keyof typeof triggerTypeLabels] || trigger.triggerType;
          
          return (
            <Card key={trigger.id} className={!trigger.enabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {typeLabel}
                    </Badge>
                  </div>
                  <Switch
                    checked={trigger.enabled}
                    onCheckedChange={(checked) => handleToggleEnabled(trigger.id, checked)}
                  />
                </div>
                <CardTitle className="text-base">{trigger.triggerName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {formatConditions(trigger.triggerConditions as Record<string, unknown>, trigger.triggerType)}
                </div>
                
                {trigger.delayHours > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Delay: {trigger.delayHours}h</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  <span>{trigger.questions.length} question{trigger.questions.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTrigger(trigger)}
                    className="flex-1"
                  >
                    <Settings className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTrigger(trigger.id, trigger.triggerName)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {triggers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Triggers Configured</h3>
            <p className="text-muted-foreground mb-4">
              Create behavioral triggers to automatically send relevant questionnaires
              based on lead actions and engagement.
            </p>
            <Button onClick={handleCreateTrigger}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Trigger
            </Button>
          </div>
        </Card>
      )}

      {/* Trigger Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Create New Trigger' : `Edit ${selectedTrigger?.triggerName}`}
            </DialogTitle>
            <DialogDescription>
              Configure when and how questionnaires should be triggered based on lead behavior.
            </DialogDescription>
          </DialogHeader>
          
          <TriggerEditor
            trigger={selectedTrigger}
            isCreateMode={isCreateMode}
            onSave={handleTriggerSaved}
            onCancel={() => setIsEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}