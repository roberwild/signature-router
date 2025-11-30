'use client';

import * as React from 'react';
import Link from 'next/link';
import NiceModal from '@ebay/nice-modal-react';
import { MessageCircleIcon, PlusIcon, ShieldIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@workspace/ui/components/sidebar';

import { FeedbackModal } from '~/components/organizations/slug/feedback-modal';
import { InviteMemberModal } from '~/components/organizations/slug/settings/organization/members/invite-member-modal';
import type { ProfileDto } from '~/types/dtos/profile-dto';
import { useTranslations } from '~/hooks/use-translations';

export type NavSupportProps = SidebarGroupProps & {
  profile: ProfileDto;
  isAdmin?: boolean;
  locale?: string;
};

export function NavSupport({
  profile,
  isAdmin = false,
  locale = 'es',
  ...other
}: NavSupportProps): React.JSX.Element {
  const { t } = useTranslations('navigation');

  const handleShowInviteMemberModal = (): void => {
    NiceModal.show(InviteMemberModal, { profile });
  };
  const handleShowFeedbackModal = (): void => {
    NiceModal.show(FeedbackModal);
  };
  return (
    <SidebarGroup {...other}>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip={t('sidebar.inviteMember')}
            className="text-muted-foreground"
            onClick={handleShowInviteMemberModal}
          >
            <PlusIcon className="size-4 shrink-0" />
            <span>{t('sidebar.inviteMember')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip={t('sidebar.feedback')}
            className="text-muted-foreground"
            onClick={handleShowFeedbackModal}
          >
            <MessageCircleIcon className="size-4 shrink-0" />
            <span>{t('sidebar.feedback')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {isAdmin && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/${locale}/admin`}>
                <ShieldIcon className="size-4 shrink-0" />
                <span>{t('sidebar.adminPanel')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
