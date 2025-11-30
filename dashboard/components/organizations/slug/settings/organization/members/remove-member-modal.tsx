'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { AlertCircleIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';

import { useTranslations } from '~/hooks/use-translations';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@workspace/ui/components/drawer';
import { FormProvider } from '@workspace/ui/components/form';
import { toast } from '@workspace/ui/components/sonner';
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query';
import { MediaQueries } from '@workspace/ui/lib/media-queries';

import { removeMember } from '~/actions/members/remove-member';
import { useEnhancedModal } from '~/hooks/use-enhanced-modal';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  removeMemberSchema,
  type RemoveMemberSchema
} from '~/schemas/members/remove-member-schema';
import type { MemberDto } from '~/types/dtos/member-dto';
import type { ProfileDto } from '~/types/dtos/profile-dto';

export type RemoveMemberModalProps = NiceModalHocProps & {
  profile: ProfileDto;
  member: MemberDto;
};

export const RemoveMemberModal = NiceModal.create<RemoveMemberModalProps>(
  ({ profile, member }) => {
    const { t } = useTranslations('organization');
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: removeMemberSchema,
      mode: 'all',
      defaultValues: {
        id: member.id
      }
    });
    const isLeaving = profile.id === member.id;
    const title = isLeaving ? t('members.team.messages.leaveOrganizationTitle') : t('members.team.messages.removeMemberTitle');
    const canSubmit =
      !methods.formState.isSubmitting &&
      methods.formState.isValid &&
      !member.isOwner;
    const onSubmit: SubmitHandler<RemoveMemberSchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      modal.handleClose();
      const result = await removeMember(values);
      if (!result?.serverError && !result?.validationErrors) {
        toast.success(isLeaving ? t('members.team.messages.leftOrganization') : t('members.team.messages.removeSuccess'));
      } else {
        toast.error(
          isLeaving ? t('members.team.messages.couldntLeaveOrganization') : t('members.team.messages.removeError')
        );
      }
    };
    const renderDescription = isLeaving ? (
      <>
        {t('members.team.messages.leaveOrganizationDescription')}
      </>
    ) : (
      <>
        {t('members.team.messages.removeMemberDescriptionPart1')}{' '}
        <strong className="text-foreground font-medium">{member.name}</strong>?{' '}
        {t('members.team.messages.removeMemberDescriptionPart2')}
      </>
    );
    const renderForm = (
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <input
          type="hidden"
          className="hidden"
          disabled={methods.formState.isSubmitting}
          {...methods.register('id')}
        />
        {member.isOwner && (
          <Alert variant="warning">
            <div className="flex flex-row items-center gap-2">
              <AlertCircleIcon className="size-[18px] shrink-0" />
              <AlertDescription>
                {isLeaving
                  ? t('members.team.messages.assignOwnerBeforeLeaving')
                  : t('members.team.messages.informMemberAssignOwner')}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </form>
    );
    const renderButtons = (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={modal.handleClose}
        >
          {t('members.invitations.actions.cancel')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          {isLeaving ? t('members.team.messages.yesLeave') : t('members.team.actions.remove')}
        </Button>
      </>
    );
    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <AlertDialog open={modal.visible}>
            <AlertDialogContent
              className="max-w-sm"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {renderDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {renderForm}
              <AlertDialogFooter>{renderButtons}</AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Drawer
            open={modal.visible}
            onOpenChange={modal.handleOpenChange}
          >
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>{renderDescription}</DrawerDescription>
              </DrawerHeader>
              {renderForm}
              <DrawerFooter className="flex-col-reverse pt-4">
                {renderButtons}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </FormProvider>
    );
  }
);
