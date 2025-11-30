'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { useTranslations } from '~/hooks/use-translations';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { cn } from '@workspace/ui/lib/utils';

import { DeleteAccountModal } from '~/components/organizations/slug/settings/account/profile/delete-account-modal';

export type DeleteAccountCardProps = CardProps & {
  ownedOrganizations: { name: string; slug: string }[];
};

export function DeleteAccountCard({
  ownedOrganizations,
  className,
  ...other
}: DeleteAccountCardProps): React.JSX.Element {
  const { t } = useTranslations('account');
  const handleShowDeleteAccountModal = (): void => {
    NiceModal.show(DeleteAccountModal, { ownedOrganizations });
  };
  return (
    <Card
      className={cn('border-destructive', className)}
      {...other}
    >
      <CardContent className="pt-6">
        <p className="text-sm font-normal text-muted-foreground">
          {t('profile.dangerZone.deleteAccount.description')}
        </p>
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <Button
          type="button"
          variant="destructive"
          size="default"
          onClick={handleShowDeleteAccountModal}
        >
          {t('profile.dangerZone.deleteAccount.button')}
        </Button>
      </CardFooter>
    </Card>
  );
}
