'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { type SubmitHandler } from 'react-hook-form';

import { useTranslations } from '~/hooks/use-translations';

import { Role } from '@workspace/database/schema';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/components/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@workspace/ui/components/drawer';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/components/select';
import { toast } from '@workspace/ui/components/sonner';
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query';
import { MediaQueries } from '@workspace/ui/lib/media-queries';
import { cn } from '@workspace/ui/lib/utils';

import { checkIfCanBeInvited } from '~/actions/invitations/check-if-can-be-invited';
import { sendInvitation } from '~/actions/invitations/send-invitation';
import { useEnhancedModal } from '~/hooks/use-enhanced-modal';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  sendInvitationSchema,
  type SendInvitationSchema
} from '~/schemas/invitations/send-invitation-schema';
import type { ProfileDto } from '~/types/dtos/profile-dto';

export type InviteMemberModalProps = NiceModalHocProps & {
  profile: ProfileDto;
};

export const InviteMemberModal = NiceModal.create<InviteMemberModalProps>(
  ({ profile }) => {
    const { t } = useTranslations('organization');
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: sendInvitationSchema,
      mode: 'onSubmit',
      defaultValues: {
        email: '',
        role: Role.MEMBER
      }
    });
    const title = t('members.invitations.actions.invite');
    const description = t('members.invitations.description');
    const canSubmit =
      !methods.formState.isSubmitting &&
      (!methods.formState.isSubmitted || methods.formState.isDirty);
    const onSubmit: SubmitHandler<SendInvitationSchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const checkResult = await checkIfCanBeInvited({
        email: values.email
      });
      if (
        !checkResult?.serverError &&
        !checkResult?.validationErrors &&
        checkResult?.data
      ) {
        if (checkResult.data.canInvite) {
          const result = await sendInvitation(values);
          if (!result?.serverError && !result?.validationErrors) {
toast.success(t('members.invitations.messages.inviteSuccess'));
            modal.hide();
          } else {
toast.error(t('members.invitations.messages.inviteError'));
          }
        } else {
          methods.setError('email', {
            message: t('members.invitations.messages.alreadyMemberOrInvited')
          });
        }
      } else {
        toast.error(t('members.invitations.messages.cantCheckAvailability'));
      }
    };
    const renderForm = (
      <form
        className={cn('space-y-4', !mdUp && 'p-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <FormField
          control={methods.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormLabel required>{t('members.invitations.fields.email')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  maxLength={255}
                  required
                  disabled={methods.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={methods.control}
          name="role"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormLabel required>{t('members.invitations.fields.role')}</FormLabel>
              <FormControl>
                <Select
                  required
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={
                    methods.formState.isSubmitting ||
                    profile.role === Role.MEMBER
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Role).map((value: Role) => (
                      <SelectItem
                        key={value}
                        value={value}
                      >
{t(`members.team.roles.${value.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
          variant="default"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
{t('members.invitations.actions.invite')}
        </Button>
      </>
    );
    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <Dialog open={modal.visible}>
            <DialogContent
              className="max-w-sm"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              {renderForm}
              <DialogFooter>{renderButtons}</DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer
            open={modal.visible}
            onOpenChange={modal.handleOpenChange}
          >
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>{title}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
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
