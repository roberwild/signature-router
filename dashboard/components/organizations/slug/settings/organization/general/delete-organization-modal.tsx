'use client';

import { useRouter } from 'next/navigation';
import NiceModal, { type NiceModalHocProps } from '@ebay/nice-modal-react';
import { type SubmitHandler } from 'react-hook-form';

import { routes } from '@workspace/routes';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@workspace/ui/components/alert-dialog';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DialogFooter } from '@workspace/ui/components/dialog';
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
import { toast } from '@workspace/ui/components/sonner';
import { useMediaQuery } from '@workspace/ui/hooks/use-media-query';
import { MediaQueries } from '@workspace/ui/lib/media-queries';
import { cn } from '@workspace/ui/lib/utils';

import { deleteOrganization } from '~/actions/organization/delete-organization';
import { useActiveOrganization } from '~/hooks/use-active-organization';
import { useEnhancedModal } from '~/hooks/use-enhanced-modal';
import { useTranslations } from '~/hooks/use-translations';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  deleteOrganizationSchema,
  type DeleteOrganizationSchema
} from '~/schemas/organization/delete-organization-schema';

export type DeleteOrganizationModalProps = NiceModalHocProps;

export const DeleteOrganizationModal =
  NiceModal.create<DeleteOrganizationModalProps>(() => {
    const { t } = useTranslations('organization');
    const modal = useEnhancedModal();
    const router = useRouter();
    const activeOrganization = useActiveOrganization();
    const mdUp = useMediaQuery(MediaQueries.MdUp, { ssr: false });
    const methods = useZodForm({
      schema: deleteOrganizationSchema,
      mode: 'all',
      defaultValues: {
        organizationName: '',
        statement: false
      }
    });
    const title = t('general.dangerZone.deleteOrganization.confirmTitle');
    const description = t('general.dangerZone.deleteOrganization.confirmDescription', { name: activeOrganization.name });
    const canSubmit =
      !methods.formState.isSubmitting &&
      methods.formState.isValid &&
      !!methods.watch('statement') &&
      methods.watch('organizationName') === activeOrganization.name;
    const onSubmit: SubmitHandler<DeleteOrganizationSchema> = async () => {
      if (!canSubmit) {
        return;
      }
      const result = await deleteOrganization();
      if (!result?.serverError && !result?.validationErrors) {
        modal.handleClose();
        toast.success(t('general.dangerZone.deleteOrganization.messages.deleteSuccess', { defaultValue: 'Organization deleted' }));
        router.push(routes.dashboard.organizations.Index);
      } else {
        toast.error(t('general.dangerZone.deleteOrganization.messages.deleteError', { defaultValue: "Couldn't delete organization" }));
      }
    };
    const renderForm = (
      <form
        className={cn('space-y-4 text-sm leading-relaxed', !mdUp && 'px-4')}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <FormField
          control={methods.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <p className="text-xs">
                {t('general.dangerZone.deleteOrganization.confirmLabel', { slug: activeOrganization.name })}
              </p>
              <FormControl>
                <Input
                  {...field}
                  disabled={methods.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={methods.control}
          name="statement"
          render={({ field }) => (
            <FormItem className="mx-1 flex flex-row items-center gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(e) => field.onChange(!!e)}
                  disabled={methods.formState.isSubmitting}
                />
              </FormControl>
              <FormLabel className="leading-2 cursor-pointer">
                {t('general.dangerZone.deleteOrganization.confirmStatement', { defaultValue: "I'll not be able to access the organization and its data anymore" })}
              </FormLabel>
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
          {t('general.dangerZone.deleteOrganization.actions.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!canSubmit}
          loading={methods.formState.isSubmitting}
          onClick={methods.handleSubmit(onSubmit)}
        >
          {t('general.dangerZone.deleteOrganization.confirmButton')}
        </Button>
      </>
    );
    return (
      <FormProvider {...methods}>
        {mdUp ? (
          <AlertDialog open={modal.visible}>
            <AlertDialogContent
              className="max-w-lg"
              onClose={modal.handleClose}
              onAnimationEndCapture={modal.handleAnimationEndCapture}
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
              </AlertDialogHeader>
              {renderForm}
              <DialogFooter>{renderButtons}</DialogFooter>
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
  });
