'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { type SubmitHandler } from 'react-hook-form';

import { useTranslations } from '~/hooks/use-translations';

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

import { revokeInvitation } from '~/actions/invitations/revoke-invitation';
import { useEnhancedModal } from '~/hooks/use-enhanced-modal';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  revokeInvitationSchema,
  type RevokeInvitationSchema
} from '~/schemas/invitations/revoke-invitation-schema';
import type { InvitationDto } from '~/types/dtos/invitation-dto';

export type RevokeInvitationModalProps = NiceModalHocProps & {
  invitation: InvitationDto;
};

export const RevokeInvitationModal =
  NiceModal.create<RevokeInvitationModalProps>(({ invitation }) => {
    const { t } = useTranslations('organization');
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: revokeInvitationSchema,
      mode: 'all',
      defaultValues: {
        id: invitation.id
      }
    });
    const title = t('members.invitations.messages.revokeInvitationTitle');
    const canSubmit =
      !methods.formState.isSubmitting && methods.formState.isValid;
    const onSubmit: SubmitHandler<RevokeInvitationSchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const result = await revokeInvitation(values);
      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t('members.invitations.messages.cancelSuccess'));
        modal.handleClose();
      } else {
        toast.error(t('members.invitations.messages.cancelError'));
      }
    };
    const renderDescription = (
      <>
        {t('members.invitations.messages.revokeInvitationDescriptionPart1')}{' '}
        <strong className="text-foreground font-medium">
          {invitation.email}
        </strong>{' '}
        {t('members.invitations.messages.revokeInvitationDescriptionPart2')}
      </>
    );
    const renderForm = (
      <form
        className="hidden"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <input
          type="hidden"
          className="hidden"
          disabled={methods.formState.isSubmitting}
          {...methods.register('id')}
        />
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
          {t('members.invitations.actions.cancel')}
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
  });
