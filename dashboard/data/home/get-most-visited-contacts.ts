import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { endOfDay, startOfDay } from 'date-fns';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { ValidationError } from '@workspace/common/errors';
import { and, count, db, desc, eq, gte, lte } from '@workspace/database/client';
import {
  contactPageVisitTable,
  contactTable
} from '@workspace/database/schema';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '~/data/caching';
import {
  getMostVisitedContactsSchema,
  type GetMostVisitedContactsSchema
} from '~/schemas/home/get-most-vistied-contacts-schema';
import type { VisitedContactDto } from '~/types/dtos/visited-contact-dto';

export async function getMostVisitedContacts(
  input: GetMostVisitedContactsSchema
): Promise<VisitedContactDto[]> {
  const ctx = await getAuthOrganizationContext();

  const result = getMostVisitedContactsSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const pageVisits = count(contactPageVisitTable.id).as('pageVisits');

      const contacts = await db
        .select({
          id: contactTable.id,
          name: contactTable.name,
          image: contactTable.image,
          record: contactTable.record,
          pageVisits
        })
        .from(contactTable)
        .leftJoin(
          contactPageVisitTable,
          and(
            eq(contactPageVisitTable.contactId, contactTable.id),
            gte(contactPageVisitTable.timestamp, startOfDay(parsedInput.from)),
            lte(contactPageVisitTable.timestamp, endOfDay(parsedInput.to))
          )
        )
        .where(eq(contactTable.organizationId, ctx.organization.id))
        .groupBy(
          contactTable.id,
          contactTable.name,
          contactTable.image,
          contactTable.record
        )
        .orderBy(desc(pageVisits))
        .limit(6);

      const response: VisitedContactDto[] = contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        image: contact.image ?? undefined,
        record: contact.record,
        pageVisits: Number(contact.pageVisits)
      }));

      return response;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.ContactPageVisits,
      ctx.organization.id,
      parsedInput.from.toISOString(),
      parsedInput.to.toISOString()
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.ContactPageVisits,
          ctx.organization.id
        ),
        Caching.createOrganizationTag(
          OrganizationCacheKey.Contacts,
          ctx.organization.id
        )
      ]
    }
  )();
}
