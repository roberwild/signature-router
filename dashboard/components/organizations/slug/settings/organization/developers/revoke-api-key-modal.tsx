'use client';

import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { type SubmitHandler } from 'react-hook-form';

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

import { revokeApiKey } from '~/actions/api-keys/revoke-api-key';
import { useEnhancedModal } from '~/hooks/use-enhanced-modal';
import { useTranslations } from '~/hooks/use-translations';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  revokeApiKeySchema,
  type RevokeApiKeySchema
} from '~/schemas/api-keys/revoke-api-key-schema';
import type { ApiKeyDto } from '~/types/dtos/api-key-dto';

export type RevokeApiKeyModalProps = NiceModalHocProps & {
  apiKey: ApiKeyDto;
};

export const RevokeApiKeyModal = NiceModal.create<RevokeApiKeyModalProps>(
  ({ apiKey }) => {
    const { t } = useTranslations('organization');
    const modal = useEnhancedModal();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: revokeApiKeySchema,
      mode: 'all',
      defaultValues: {
        id: apiKey.id
      }
    });
    const title = t('developers.apiKeys.messages.revokeTitle');
    const canSubmit =
      !methods.formState.isSubmitting && methods.formState.isValid;
    const onSubmit: SubmitHandler<RevokeApiKeySchema> = async (values) => {
      if (!canSubmit) {
        return;
      }
      const result = await revokeApiKey(values);
      if (!result?.serverError && !result?.validationErrors) {
        toast.success(t('developers.apiKeys.messages.revokeSuccess'));
        modal.handleClose();
      } else {
        toast.error(t('developers.apiKeys.messages.revokeError'));
      }
    };
    const renderDescription = (
      <>
        {t('developers.apiKeys.messages.revokeDescription', {
          description: (
            <strong className="text-foreground font-medium">
              {apiKey.description}
            </strong>
          )
        })}
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
{t('developers.apiKeys.actions.cancel')}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
{t('developers.apiKeys.messages.revokeConfirm')}
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
