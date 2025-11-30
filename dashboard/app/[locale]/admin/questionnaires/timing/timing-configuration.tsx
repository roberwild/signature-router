'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { Slider } from '@workspace/ui/components/slider';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { Badge } from '@workspace/ui/components/badge';
import { 
  Clock, 
  Calendar, 
  RefreshCw, 
  Save, 
  AlertCircle,
  Undo2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TimingStrategy } from '~/data/admin/questionnaires/get-timing-strategies';

interface TimingConfigurationProps {
  initialStrategies: TimingStrategy[];
  locale: string;
}

const categoryDescriptions = {
  A1: {
    label: 'High Priority Leads',
    description: 'Most engaged leads with high buying intent',
    color: 'bg-green-500'
  },
  B1: {
    label: 'Medium Priority Leads',
    description: 'Moderately engaged with potential interest',
    color: 'bg-blue-500'
  },
  C1: {
    label: 'Low Priority Leads',
    description: 'Less engaged but still viable',
    color: 'bg-yellow-500'
  },
  D1: {
    label: 'Minimal Priority Leads',
    description: 'Lowest engagement, nurture carefully',
    color: 'bg-red-500'
  }
};

export function TimingConfiguration({ initialStrategies, locale: _locale }: TimingConfigurationProps) {
  const [strategies, setStrategies] = useState<TimingStrategy[]>(initialStrategies);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<TimingStrategy[]>(initialStrategies);
  const [selectedCategory, setSelectedCategory] = useState('A1');

  const currentStrategy = strategies.find(s => s.category === selectedCategory);

  const handleStrategyChange = (category: string, field: keyof TimingStrategy, value: unknown) => {
    setStrategies(prev => prev.map(s => 
      s.category === category ? { ...s, [field]: value } : s
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save all changes
      const promises = strategies.map(strategy => 
        fetch('/api/admin/questionnaires/timing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: strategy.category,
            initialWaitDays: strategy.initialWaitDays,
            cooldownHours: strategy.cooldownHours,
            maxSessionsPerWeek: strategy.maxSessionsPerWeek,
            enabled: strategy.enabled
          })
        })
      );

      await Promise.all(promises);
      
      setLastSaved(strategies);
      setHasChanges(false);
      toast.success('Timing strategies saved successfully');
    } catch (error) {
      toast.error('Failed to save timing strategies');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    setStrategies(lastSaved);
    setHasChanges(false);
  };

  const calculateImpact = (strategy: TimingStrategy) => {
    const daysPerWeek = 7;
    const _hoursPerWeek = daysPerWeek * 24;
    
    // Calculate maximum possible sessions per month
    const cooldownDays = strategy.cooldownHours / 24;
    const sessionsPerMonth = Math.min(
      30 / (cooldownDays + 1),
      strategy.maxSessionsPerWeek * 4
    );
    
    return {
      sessionsPerMonth: Math.round(sessionsPerMonth * 10) / 10,
      avgDaysBetween: Math.round((30 / sessionsPerMonth) * 10) / 10,
      firstContactDay: strategy.initialWaitDays
    };
  };

  if (!currentStrategy) return null;

  const impact = calculateImpact(currentStrategy);
  const categoryInfo = categoryDescriptions[selectedCategory as keyof typeof categoryDescriptions];

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <div>
            <AlertTitle className="ml-6 mt-1">Unsaved Changes</AlertTitle>
            <AlertDescription className="mt-1">
              You have unsaved changes. Don't forget to save before leaving this page.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {strategies.map(strategy => (
            <TabsTrigger 
              key={strategy.category} 
              value={strategy.category}
              className="relative"
            >
              <span className={`absolute left-2 w-2 h-2 rounded-full ${categoryDescriptions[strategy.category as keyof typeof categoryDescriptions].color}`} />
              <span className="ml-4">{strategy.category}</span>
              {!strategy.enabled && (
                <Badge variant="outline" className="ml-2 text-xs">Disabled</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{categoryInfo.label}</CardTitle>
                  <CardDescription>{categoryInfo.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enabled">Enabled</Label>
                  <Switch
                    id="enabled"
                    checked={currentStrategy.enabled}
                    onCheckedChange={(checked) => 
                      handleStrategyChange(selectedCategory, 'enabled', checked)
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Initial Wait Period */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Initial Wait Period
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Days to wait before first questionnaire
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    {currentStrategy.initialWaitDays} days
                  </div>
                </div>
                <Slider
                  value={[currentStrategy.initialWaitDays]}
                  onValueChange={([value]) => 
                    handleStrategyChange(selectedCategory, 'initialWaitDays', value)
                  }
                  min={0}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Immediate</span>
                  <span>1 week</span>
                  <span>2 weeks</span>
                  <span>1 month</span>
                </div>
              </div>

              {/* Cooldown Period */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Cooldown Period
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Minimum time between questionnaires
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    {currentStrategy.cooldownHours} hours
                  </div>
                </div>
                <Slider
                  value={[currentStrategy.cooldownHours]}
                  onValueChange={([value]) => 
                    handleStrategyChange(selectedCategory, 'cooldownHours', value)
                  }
                  min={24}
                  max={168}
                  step={12}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 day</span>
                  <span>2 days</span>
                  <span>4 days</span>
                  <span>1 week</span>
                </div>
                {currentStrategy.cooldownHours < 48 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <div>
                      <AlertTitle className="ml-6 mt-1">Aggressive Timing</AlertTitle>
                      <AlertDescription className="mt-1">
                        Cooldown periods under 48 hours may annoy leads and reduce response rates.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>

              {/* Max Sessions Per Week */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Max Sessions Per Week
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Maximum questionnaire sessions per week
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    {currentStrategy.maxSessionsPerWeek} sessions
                  </div>
                </div>
                <Slider
                  value={[currentStrategy.maxSessionsPerWeek]}
                  onValueChange={([value]) => 
                    handleStrategyChange(selectedCategory, 'maxSessionsPerWeek', value)
                  }
                  min={1}
                  max={7}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1/week</span>
                  <span>3/week</span>
                  <span>5/week</span>
                  <span>Daily</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Impact Preview
              </CardTitle>
              <CardDescription>
                Estimated engagement based on current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">First Contact</Label>
                  <p className="text-2xl font-bold">Day {impact.firstContactDay}</p>
                  <p className="text-xs text-muted-foreground">After lead creation</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Sessions/Month</Label>
                  <p className="text-2xl font-bold">{impact.sessionsPerMonth}</p>
                  <p className="text-xs text-muted-foreground">Maximum possible</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Avg Days Between</Label>
                  <p className="text-2xl font-bold">{impact.avgDaysBetween}</p>
                  <p className="text-xs text-muted-foreground">Between sessions</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Timeline Example:</strong> A lead in category {selectedCategory} will receive their first questionnaire 
                  on day {impact.firstContactDay}, then approximately every {impact.avgDaysBetween} days 
                  (up to {currentStrategy.maxSessionsPerWeek} times per week), 
                  with at least {currentStrategy.cooldownHours} hours between sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleUndo}
          disabled={!hasChanges}
        >
          <Undo2 className="mr-2 h-4 w-4" />
          Undo Changes
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}