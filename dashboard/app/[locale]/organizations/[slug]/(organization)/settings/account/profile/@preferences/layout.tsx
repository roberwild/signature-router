import * as React from 'react';
import { PreferencesLayout } from '~/components/organizations/slug/settings/account/profile/preferences-layout';

export default function PreferencesLayoutPage({
  children
}: React.PropsWithChildren): React.JSX.Element {
  return (
    <PreferencesLayout>
      {children}
    </PreferencesLayout>
  );
}
