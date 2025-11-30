'use client';

import { ConfigurationItem } from './configuration-item';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

interface ConfigurationCardProps {
  category: string;
  configs: Array<{
    id: string;
    key: string;
    value: string;
    is_sensitive: boolean;
    updated_at: Date | string;
    created_at: Date | string;
  }>;
  onEdit: (config: Record<string, unknown>) => void;
  onUpdate: (key: string, value: string) => Promise<void>;
  onEditSensitive: (config: Record<string, unknown>) => void;
}

const categoryLabels: Record<string, string> = {
  analytics: 'Analytics',
  email: 'Email',
  monitoring: 'Monitoring',
  billing: 'Billing',
  api: 'API',
  other: 'Other'
};

const categoryDescriptions: Record<string, string> = {
  analytics: 'Analytics and tracking configurations',
  email: 'Email service and notification settings',
  monitoring: 'System monitoring and alerting',
  billing: 'Payment and billing configurations',
  api: 'External API integrations',
  other: 'General platform configurations'
};

export function ConfigurationCard({ category, configs, onEdit, onUpdate, onEditSensitive }: ConfigurationCardProps) {
  const sensitiveCount = configs.filter(c => c.is_sensitive).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{categoryLabels[category] || category}</CardTitle>
            <CardDescription>
              {categoryDescriptions[category] || 'Platform configurations'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {configs.length} config{configs.length !== 1 ? 's' : ''}
            </Badge>
            {sensitiveCount > 0 && (
              <Badge variant="outline">
                {sensitiveCount} sensitive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {configs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No configurations in this category
          </p>
        ) : (
          <div className="space-y-2">
            {configs.map((config) => (
              <ConfigurationItem
                key={config.id}
                config={config}
                onEdit={onEdit}
                onUpdate={onUpdate}
                onEditSensitive={onEditSensitive}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}