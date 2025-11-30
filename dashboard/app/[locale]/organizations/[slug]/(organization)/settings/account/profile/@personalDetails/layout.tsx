import * as React from 'react';
import { PersonalDetailsLayout } from '~/components/organizations/slug/settings/account/profile/personal-details-layout';

export default function PersonalDetailsLayoutPage({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <PersonalDetailsLayout>
      {children}
    </PersonalDetailsLayout>
  );
}
