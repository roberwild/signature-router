'use server';

import { revalidateTag } from 'next/cache';

import { NotFoundError } from '@workspace/common/errors';
import { and, db, eq } from '@workspace/database/client';
import { apiKeyTable } from '@workspace/database/schema';

import { authOrganizationActionClient } from '~/actions/safe-action';
import { Caching, OrganizationCacheKey } from '~/data/caching';
import { revokeApiKeySchema } from '~/schemas/api-keys/revoke-api-key-schema';

export const revokeApiKey = authOrganizationActionClient
  .metadata({ actionName: 'revokeApiKey' })
  .schema(revokeApiKeySchema)
  .action(async ({ parsedInput, ctx }) => {
    const [apiKey] = await db
      .select({})
      .from(apiKeyTable)
      .where(
        and(
          eq(apiKeyTable.id, parsedInput.id),
          eq(apiKeyTable.organizationId, ctx.organization.id)
        )
      )
      .limit(1);

    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }

    await db.delete(apiKeyTable).where(eq(apiKeyTable.id, parsedInput.id));

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.ApiKeys,
        ctx.organization.id
      )
    );
  });
