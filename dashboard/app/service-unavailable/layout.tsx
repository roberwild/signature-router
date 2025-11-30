import * as React from 'react';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Unavailable',
  description: 'The service is temporarily unavailable. Please try again later.'
};

export default function ServiceUnavailableLayout({
  children
}: React.PropsWithChildren): React.JSX.Element {
  // This layout bypasses auth completely
  return <>{children}</>;
}