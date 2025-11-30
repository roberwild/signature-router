'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { MoreHorizontalIcon } from 'lucide-react';

import { useTranslations } from '~/hooks/use-translations';

import { InvitationStatus } from '@workspace/database/schema';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@workspace/ui/components/dropdown-menu';
import { toast } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/ui/lib/utils';

import { deleteInvitation } from '~/actions/invitations/delete-invitation';
import { resendInvitation } from '~/actions/invitations/resend-invitation';
import { EditInvitationModal } from '~/components/organizations/slug/settings/organization/members/edit-invitation-modal';
import { RevokeInvitationModal } from '~/components/organizations/slug/settings/organization/members/revoke-invitation-modal';
import type { InvitationDto } from '~/types/dtos/invitation-dto';
import type { ProfileDto } from '~/types/dtos/profile-dto';

export type InvitationListProps = React.HtmlHTMLAttributes<HTMLUListElement> & {
  profile: ProfileDto;
  invitations: InvitationDto[];
};

export function InvitationList({
  profile,
  invitations,
  className,
  ...other
}: InvitationListProps): React.JSX.Element {
  return (
    <ul
      role="list"
      className={cn('m-0 list-none divide-y p-0', className)}
      {...other}
    >
      {invitations.map((invitation) => (
        <InvitationListItem
          key={invitation.id}
          profile={profile}
          invitation={invitation}
        />
      ))}
    </ul>
  );
}

type InvitationListItemProps = React.HtmlHTMLAttributes<HTMLLIElement> & {
  profile: ProfileDto;
  invitation: InvitationDto;
};

function InvitationListItem({
  profile,
  invitation,
  className,
  ...other
}: InvitationListItemProps): React.JSX.Element {
  const { t } = useTranslations('organization');
  const handleShowEditInvitationModal = (): void => {
    NiceModal.show(EditInvitationModal, { profile, invitation });
  };
  const handleResendInvitation = async (): Promise<void> => {
    const result = await resendInvitation({ id: invitation.id });
    if (!result?.serverError && !result?.validationErrors) {
toast.success(t('members.invitations.messages.resendSuccess'));
    } else {
toast.error(t('members.invitations.messages.resendError'));
    }
  };
  const handleShowRevokeInvitationModal = (): void => {
    NiceModal.show(RevokeInvitationModal, { invitation });
  };
  const handleDeleteInvitation = async (): Promise<void> => {
    const result = await deleteInvitation({ id: invitation.id });
    if (!result?.serverError && !result?.validationErrors) {
toast.success(t('members.invitations.messages.cancelSuccess'));
    } else {
toast.error(t('members.invitations.messages.cancelError'));
    }
  };
  return (
    <li
      role="listitem"
      className={cn('flex w-full flex-row justify-between p-6', className)}
      {...other}
    >
      <div className="flex flex-row items-center gap-4">
        <div className="flex flex-col">
          <div className="text-sm font-medium">
{t(`members.invitations.status.${invitation.status.toLowerCase()}`)}
          </div>
          <div className="text-xs font-normal text-muted-foreground">
            {invitation.email}
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Badge
          variant="secondary"
          className="hidden rounded-3xl sm:inline-block"
        >
{t(`members.team.roles.${invitation.role.toLowerCase()}`)}
        </Badge>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-8 p-0"
title={t('members.team.actions.edit')}
            >
              <MoreHorizontalIcon className="size-4 shrink-0" />
              <span className="sr-only">{t('members.team.actions.edit')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {invitation.status === InvitationStatus.PENDING && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleShowEditInvitationModal}
                >
{t('members.team.actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleResendInvitation}
                >
{t('members.invitations.actions.resend')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="!text-destructive cursor-pointer"
                  onClick={handleShowRevokeInvitationModal}
                >
{t('members.invitations.actions.cancel')}
                </DropdownMenuItem>
              </>
            )}
            {invitation.status === InvitationStatus.REVOKED && (
              <DropdownMenuItem
                className="!text-destructive cursor-pointer"
                onClick={handleDeleteInvitation}
              >
                {t('members.invitations.messages.delete')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
