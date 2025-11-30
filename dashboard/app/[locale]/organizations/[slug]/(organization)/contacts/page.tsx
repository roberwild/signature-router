import * as React from 'react';
import { type Metadata } from 'next';

import { Card, CardContent } from '@workspace/ui/components/card';

// import { AddContactButton } from '~/components/organizations/slug/contacts/add-contact-button';
import { ContactsDataTable } from '~/components/organizations/slug/contacts/contacts-data-table';
import { ContactsEmptyState } from '~/components/organizations/slug/contacts/contacts-empty-state';
import { ContactsFilters } from '~/components/organizations/slug/contacts/contacts-filters';
import { searchParamsCache } from '~/components/organizations/slug/contacts/contacts-search-params';
import { getContactTags } from '~/data/contacts/get-contact-tags';
import { getContacts } from '~/data/contacts/get-contacts';
import { TransitionProvider } from '~/hooks/use-transition-context';
import { createTitle } from '~/lib/formatters';
import { PageHeader } from '~/components/organizations/slug/page-header';

export const metadata: Metadata = {
  title: createTitle('Contactos')
};

export default async function ContactsPage({
  searchParams
}: NextPageProps): Promise<React.JSX.Element> {
  const parsedSearchParams = await searchParamsCache.parse(searchParams);

  const [{ contacts, filteredCount, totalCount }, tags] = await Promise.all([
    getContacts(parsedSearchParams),
    getContactTags()
  ]);

  const hasAnyContacts = totalCount > 0;

  return (
    <TransitionProvider>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Page Header */}
        <PageHeader
          title="Contactos"
          description={`Total ${totalCount} ${totalCount === 1 ? 'contacto' : 'contactos'} en tu organización`}
          icon="Users"
          actions={hasAnyContacts ? [
            {
              label: 'Añadir Contacto',
              href: '#',
              icon: "Plus",
              onClick: () => {
                // AddContactButton functionality
              }
            }
          ] : []}
        />
        
        {/* Filters Section */}
        {hasAnyContacts && (
          <Card>
            <CardContent className="p-4">
              <React.Suspense>
                <ContactsFilters tags={tags} />
              </React.Suspense>
            </CardContent>
          </Card>
        )}
        
        {/* Main Content */}
        <div className="space-y-6">
          {hasAnyContacts ? (
            <React.Suspense>
              <ContactsDataTable
                data={contacts}
                totalCount={filteredCount}
              />
            </React.Suspense>
          ) : (
            <ContactsEmptyState />
          )}
        </div>
      </div>
    </TransitionProvider>
  );
}
