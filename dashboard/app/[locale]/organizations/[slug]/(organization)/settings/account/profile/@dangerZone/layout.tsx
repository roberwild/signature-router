import * as React from 'react';
import { DangerZoneLayout } from '~/components/organizations/slug/settings/account/profile/danger-zone-layout';

export default function DangerZoneLayoutPage({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <DangerZoneLayout>
      {children}
    </DangerZoneLayout>
  );
}
