'use client';

import { Mail, Cloud, Send, Hash } from 'lucide-react';
import { useTranslations } from '~/hooks/use-translations';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group';
import { Label } from '@workspace/ui/components/label';
import { Card } from '@workspace/ui/components/card';
import type { EmailProvider } from '../types';

interface ProviderSelectorProps {
  value: EmailProvider;
  onChange: (value: EmailProvider) => void;
}

const getProviders = (t: (key: string, params?: Record<string, string | number>) => string) => [
  {
    id: 'nodemailer' as const,
    name: t('providers.nodemailer.name'),
    description: t('providers.nodemailer.description'),
    icon: Mail,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    id: 'resend' as const,
    name: t('providers.resend.name'),
    description: t('providers.resend.description'),
    icon: Cloud,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    id: 'sendgrid' as const,
    name: t('providers.sendgrid.name'),
    description: t('providers.sendgrid.description'),
    icon: Send,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  {
    id: 'postmark' as const,
    name: t('providers.postmark.name'),
    description: t('providers.postmark.description'),
    icon: Hash,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
];

export function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  const { t } = useTranslations('admin/email-settings.provider');
  const providers = getProviders(t);

  return (
    <RadioGroup value={value} onValueChange={onChange}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const isSelected = value === provider.id;

          return (
            <Card
              key={provider.id}
              className={`relative cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
            >
              <Label
                htmlFor={provider.id}
                className="flex items-start space-x-3 p-4 cursor-pointer"
              >
                <RadioGroupItem
                  value={provider.id}
                  id={provider.id}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${provider.bgColor}`}>
                      <Icon className={`h-5 w-5 ${provider.color}`} />
                    </div>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {provider.description}
                      </div>
                    </div>
                  </div>
                </div>
              </Label>
            </Card>
          );
        })}
      </div>
    </RadioGroup>
  );
}