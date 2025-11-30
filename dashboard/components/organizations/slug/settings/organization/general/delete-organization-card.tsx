'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { cn } from '@workspace/ui/lib/utils';

import { DeleteOrganizationModal } from '~/components/organizations/slug/settings/organization/general/delete-organization-modal';
import { useTranslations } from '~/hooks/use-translations';
import type { ProfileDto } from '~/types/dtos/profile-dto';

export type DeleteOrganizationCardProps = CardProps & {
  profile: ProfileDto;
};

export function DeleteOrganizationCard({
  profile,
  className,
  ...other
}: DeleteOrganizationCardProps): React.JSX.Element {
  const { t } = useTranslations('organization');
  const handleShowDeleteOrganizationModal = (): void => {
    NiceModal.show(DeleteOrganizationModal);
  };
  return (
    <Card
      className={cn('border-destructive', className)}
      {...other}
    >
      <CardContent className="pt-6">
        <p className="text-sm font-normal text-muted-foreground">
          {t('general.dangerZone.deleteOrganization.description')}
        </p>
      </CardContent>
      <Separator />
      <CardFooter className="flex w-full justify-end pt-6">
        <Button
          type="button"
          variant="destructive"
          size="default"
          disabled={!profile.isOwner}
          onClick={handleShowDeleteOrganizationModal}
        >
{t('general.dangerZone.deleteOrganization.button')}
        </Button>
      </CardFooter>
    </Card>
  );
}
