'use server';

import { revalidateTag } from 'next/cache';

import { and, db, eq, inArray } from '@workspace/database/client';
import { contactTable } from '@workspace/database/schema';

import { authOrganizationActionClient } from '~/actions/safe-action';
import { Caching, OrganizationCacheKey } from '~/data/caching';
import { deleteContactsSchema } from '~/schemas/contacts/delete-contacts-schema';

export const deleteContacts = authOrganizationActionClient
  .metadata({ actionName: 'deleteContacts' })
  .schema(deleteContactsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .delete(contactTable)
      .where(
        and(
          eq(contactTable.organizationId, ctx.organization.id),
          inArray(contactTable.id, parsedInput.ids)
        )
      );

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.Contacts,
        ctx.organization.id
      )
    );

    for (const id of parsedInput.ids) {
      revalidateTag(
        Caching.createOrganizationTag(OrganizationCacheKey.Contact, id)
      );
    }

    for (const membership of ctx.organization.memberships) {
      revalidateTag(
        Caching.createOrganizationTag(
          OrganizationCacheKey.Favorites,
          ctx.organization.id,
          membership.userId
        )
      );
    }
  });
