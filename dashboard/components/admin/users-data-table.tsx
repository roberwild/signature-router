'use client';

import * as React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail,
  Phone,
  Building2,
  Shield,
  CheckCircle,
  Eye,
  Target,
  Clock,
} from 'lucide-react';
import { UserActions } from '~/app/[locale]/admin/users/components/user-actions';

import { DataTable } from './data-table/data-table';
import { DataTableColumnHeader } from './data-table/column-header';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from '~/hooks/use-translations';

type UserWithLeadData = {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
  isPlatformAdmin: boolean;
  createdAt: Date;
  organizationCount: number;
  // Lead qualification data
  leadScore?: number | null;
  leadClassification?: 'A1' | 'B1' | 'C1' | 'D1' | null;
  hasLeadData: boolean;
  lastLeadActivity?: Date | null;
  totalLeadQualifications?: number;
};

interface UsersDataTableProps {
  data: UserWithLeadData[];
  locale: string;
}

const classificationColors = {
  A1: 'bg-green-500',
  B1: 'bg-blue-500',
  C1: 'bg-yellow-500',
  D1: 'bg-gray-400',
};

export function UsersDataTable({ data, locale }: UsersDataTableProps) {
  const { t } = useTranslations('admin/users');

  const classificationLabels = {
    A1: t('leadStatus.hotLead'),
    B1: t('leadStatus.warmLead'),
    C1: t('leadStatus.coldLead'),
    D1: t('leadStatus.lowIntent'),
  };
  const columns: ColumnDef<UserWithLeadData>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('tableHeaders.user')} />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <div className="flex items-center gap-2">
                {user.isPlatformAdmin && (
                  <Badge variant="secondary" className="text-xs h-5">
                    <Shield className="mr-1 h-3 w-3" />
                    {t('userCard.admin')}
                  </Badge>
                )}
                {user.emailVerified && (
                  <Badge variant="outline" className="text-xs h-5">
                    <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                    {t('userCard.verified')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('tableHeaders.contact')} />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1">
            {user.email ? (
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Mail className="h-3 w-3" />
                {user.email}
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">{t('contactInfo.noEmail')}</span>
            )}
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                <Phone className="h-3 w-3" />
                {user.phone}
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'leadScore',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('tableHeaders.leadStatus')} />
      ),
      cell: ({ row }) => {
        const user = row.original;
        
        if (!user.hasLeadData) {
          return (
            <Badge variant="outline" className="text-xs">
              {t('leadStatus.noLeadData')}
            </Badge>
          );
        }

        return (
          <div className="flex flex-col gap-2">
            {user.leadClassification && (
              <Badge
                className={cn(
                  'text-white text-xs',
                  classificationColors[user.leadClassification]
                )}
              >
                {classificationLabels[user.leadClassification]}
              </Badge>
            )}
            {user.leadScore !== null && user.leadScore !== undefined && (
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">{user.leadScore}/100</span>
              </div>
            )}
            {user.lastLeadActivity && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(user.lastLeadActivity), 'dd MMM', { locale: es })}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('leadStatus.lastActivity')}: {format(new Date(user.lastLeadActivity), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'organizationCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('tableHeaders.organizations')} />
      ),
      cell: ({ row }) => {
        const count = row.getValue('organizationCount') as number;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('tableHeaders.joined')} />
      ),
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return (
          <div className="text-sm text-muted-foreground">
            {format(new Date(date), 'dd/MM/yyyy', { locale: es })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/admin/users/${user.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                {t('actions.view')}
              </Button>
            </Link>
            <UserActions user={user} locale={locale} />
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder={t('searchPlaceholder')}
    />
  );
}