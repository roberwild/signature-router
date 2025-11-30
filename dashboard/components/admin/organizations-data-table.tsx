'use client';

import * as React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';

import {
  Building2,
  Users,
  Mail,
  Phone,
  Eye,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { OrganizationActions } from '~/app/[locale]/admin/organizations/components/organization-actions';

import { DataTable } from './data-table/data-table';
import { DataTableColumnHeader } from './data-table/column-header';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

type OrganizationWithLeadData = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  // Lead data (aggregated from members or single member)
  leadScore?: number | null;
  leadClassification?: 'A1' | 'B1' | 'C1' | 'D1' | null;
  hasLeadData: boolean;
  leadCount?: number;
  avgLeadScore?: number | null;
  topLeadClassification?: 'A1' | 'B1' | 'C1' | 'D1' | null;
};

interface OrganizationsDataTableProps {
  data: OrganizationWithLeadData[];
  locale: string;
  dict?: {
    leadClassification?: {
      A1?: string;
      B1?: string;
      C1?: string;
      D1?: string;
      best?: string;
      avg?: string;
      leads?: string;
      lead?: string;
    };
    table?: {
      organization?: string;
      owner?: string;
      leadStatus?: string;
      members?: string;
      searchPlaceholder?: string;
    };
    status?: {
      noOwner?: string;
      noLeadData?: string;
    };
    actions?: {
      view?: string;
      openMenu?: string;
      actions?: string;
      copyOrganizationId?: string;
      copySlug?: string;
      viewOrganization?: string;
      viewMembers?: string;
      contactOwner?: string;
      editDetails?: string;
      addMember?: string;
      transferOwnership?: string;
      deleteOrganization?: string;
      cancel?: string;
      saving?: string;
      saveChanges?: string;
    };
    toasts?: {
      failedToLoadMembers?: string;
      failedToLoadUsers?: string;
      selectUser?: string;
      memberAddedSuccess?: string;
      failedToAddMember?: string;
      selectNewOwner?: string;
      ownershipTransferredSuccess?: string;
      failedToTransferOwnership?: string;
      organizationUpdatedSuccess?: string;
      failedToUpdateOrganization?: string;
      organizationDeletedSuccess?: string;
      failedToDeleteOrganization?: string;
      organizationIdCopied?: string;
      slugCopied?: string;
    };
    dialogs?: {
      editOrganization?: {
        title?: string;
        description?: string;
        organizationName?: string;
        nameplaceholder?: string;
        urlSlug?: string;
        slugPlaceholder?: string;
        urlPreview?: string;
      };
    };
  };
}

const classificationColors = {
  A1: 'bg-green-500',
  B1: 'bg-blue-500',
  C1: 'bg-yellow-500',
  D1: 'bg-gray-400',
};

const getClassificationLabels = (dict?: OrganizationsDataTableProps['dict']) => ({
  A1: dict?.leadClassification?.A1 || 'Hot Lead',
  B1: dict?.leadClassification?.B1 || 'Warm Lead',
  C1: dict?.leadClassification?.C1 || 'Cold Lead',
  D1: dict?.leadClassification?.D1 || 'Low Intent',
});

export function OrganizationsDataTable({ data, locale, dict }: OrganizationsDataTableProps) {
  const classificationLabels = getClassificationLabels(dict);
  const columns: ColumnDef<OrganizationWithLeadData>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={dict?.table?.organization || "Organization"} />
      ),
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium">{org.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">/{org.slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'owner',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={dict?.table?.owner || "Owner"} />
      ),
      cell: ({ row }) => {
        const owner = row.original.owner;
        
        if (!owner) {
          return (
            <Badge variant="outline" className="text-xs">
              {dict?.status?.noOwner || "No owner"}
            </Badge>
          );
        }

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{owner.name}</span>
            </div>
            <a
              href={`mailto:${owner.email}`}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              {owner.email}
            </a>
            {owner.phone && (
              <a
                href={`tel:${owner.phone}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <Phone className="h-3 w-3" />
                {owner.phone}
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'leadScore',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={dict?.table?.leadStatus || "Lead Status"} />
      ),
      cell: ({ row }) => {
        const org = row.original;
        
        if (!org.hasLeadData) {
          return (
            <Badge variant="outline" className="text-xs">
              {dict?.status?.noLeadData || "No lead data"}
            </Badge>
          );
        }

        // For single member orgs, show individual lead data
        if (org.memberCount === 1 && org.leadClassification) {
          return (
            <div className="flex flex-col gap-2">
              <Badge
                className={cn(
                  'text-white text-xs',
                  classificationColors[org.leadClassification]
                )}
              >
                {classificationLabels[org.leadClassification]}
              </Badge>
              {org.leadScore !== null && org.leadScore !== undefined && (
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{org.leadScore}/100</span>
                </div>
              )}
            </div>
          );
        }

        // For multi-member orgs, show aggregated data
        return (
          <div className="flex flex-col gap-2">
            {org.topLeadClassification && (
              <Badge
                className={cn(
                  'text-white text-xs',
                  classificationColors[org.topLeadClassification]
                )}
              >
                {dict?.leadClassification?.best || "Best"}: {classificationLabels[org.topLeadClassification]}
              </Badge>
            )}
            {org.avgLeadScore !== null && org.avgLeadScore !== undefined && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">
                  {dict?.leadClassification?.avg || "Avg"}: {Math.round(org.avgLeadScore)}/100
                </span>
              </div>
            )}
            {org.leadCount && org.leadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {org.leadCount} {org.leadCount > 1 ? (dict?.leadClassification?.leads || 'leads') : (dict?.leadClassification?.lead || 'lead')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'memberCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={dict?.table?.members || "Members"} />
      ),
      cell: ({ row }) => {
        const count = row.getValue('memberCount') as number;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{count}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const org = row.original;

        return (
          <div className="flex items-center gap-2">
            <Link href={`/${locale}/organizations/${org.slug}`}>
              <Button size="sm" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                {dict?.actions?.view || "View"}
              </Button>
            </Link>
            <OrganizationActions
              organization={{
                id: org.id,
                name: org.name,
                slug: org.slug,
                industry: null,
                owner: org.owner
              }}
              locale={locale}
              dict={dict}
            />
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder={dict?.table?.searchPlaceholder || "Search organizations by name or slug..."}
    />
  );
}