'use client';

import * as React from 'react';

import {
  Card,
  CardContent,
  type CardProps
} from '@workspace/ui/components/card';
import { EmptyText } from '@workspace/ui/components/empty-text';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { cn } from '@workspace/ui/lib/utils';

import { InvoiceList } from '~/components/organizations/slug/settings/organization/billing/invoice-list';
import { useTranslations } from '~/hooks/use-translations';
import type { InvoiceDto } from '~/types/dtos/invoice-dto';

export type InvoicesCardProps = CardProps & {
  invoices: InvoiceDto[];
};

export function InvoicesCard({
  invoices,
  className,
  ...other
}: InvoicesCardProps): React.JSX.Element {
  const { t } = useTranslations('organization');
  return (
    <Card
      className={cn('flex h-full flex-col', className)}
      {...other}
    >
      <CardContent className="max-h-72 flex-1 overflow-hidden p-0">
        {invoices.length > 0 ? (
          <ScrollArea className="h-full">
            <InvoiceList invoices={invoices} />
          </ScrollArea>
        ) : (
          <EmptyText className="p-6">{t('billing.invoices.empty.noInvoices')}</EmptyText>
        )}
      </CardContent>
    </Card>
  );
}
