import 'server-only';

import { unstable_cache as cache } from 'next/cache';
import { endOfDay, format, startOfDay } from 'date-fns';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { ValidationError } from '@workspace/common/errors';
import { db, sql } from '@workspace/database/client';
import { ContactRecord, contactTable } from '@workspace/database/schema';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '~/data/caching';
import {
  getLeadGenerationDataSchema,
  type GetLeadGenerationDataSchema
} from '~/schemas/home/get-lead-generation-data-schema';
import type { LeadGenerationDataPointDto } from '~/types/dtos/lead-generation-data-point-dto';

export async function getLeadGenerationData(
  input: GetLeadGenerationDataSchema
): Promise<LeadGenerationDataPointDto[]> {
  const ctx = await getAuthOrganizationContext();

  const result = getLeadGenerationDataSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(JSON.stringify(result.error.flatten()));
  }
  const parsedInput = result.data;

  return cache(
    async () => {
      const contacts = await db
        .select({
          record: contactTable.record,
          createdAt: contactTable.createdAt
        })
        .from(contactTable)
        .where(
          sql`${contactTable.organizationId} = ${ctx.organization.id} 
          AND ${contactTable.createdAt} BETWEEN ${startOfDay(parsedInput.from)} AND ${endOfDay(parsedInput.to)}`
        );

      const dataPointsByDate = Object.values(
        contacts.reduce(
          (acc, { record, createdAt }) => {
            const date = format(createdAt, 'yyyy-MM-dd');
            acc[date] = acc[date] || { date, people: 0, companies: 0 };
            acc[date][
              record === ContactRecord.PERSON ? 'people' : 'companies'
            ]++;

            return acc;
          },
          {} as Record<string, LeadGenerationDataPointDto>
        )
      );

      return dataPointsByDate.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.LeadGenerationData,
      ctx.organization.id,
      parsedInput.from.toISOString(),
      parsedInput.to.toISOString()
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.LeadGenerationData,
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
