import 'server-only';

import { unstable_cache as cache } from 'next/cache';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { asc, db, eq } from '@workspace/database/client';
import { apiKeyTable } from '@workspace/database/schema';

import {
  Caching,
  defaultRevalidateTimeInSeconds,
  OrganizationCacheKey
} from '~/data/caching';
import type { ApiKeyDto } from '~/types/dtos/api-key-dto';

export async function getApiKeys(): Promise<ApiKeyDto[]> {
  const ctx = await getAuthOrganizationContext();

  return cache(
    async () => {
      const apiKeys = await db
        .select({
          id: apiKeyTable.id,
          description: apiKeyTable.description,
          lastUsedAt: apiKeyTable.lastUsedAt,
          expiresAt: apiKeyTable.expiresAt
        })
        .from(apiKeyTable)
        .where(eq(apiKeyTable.organizationId, ctx.organization.id))
        .orderBy(asc(apiKeyTable.createdAt));

      const response: ApiKeyDto[] = apiKeys.map((apiKey) => ({
        id: apiKey.id,
        description: apiKey.description,
        lastUsedAt: apiKey.lastUsedAt ?? undefined,
        expiresAt: apiKey.expiresAt ?? undefined
      }));

      return response;
    },
    Caching.createOrganizationKeyParts(
      OrganizationCacheKey.ApiKeys,
      ctx.organization.id
    ),
    {
      revalidate: defaultRevalidateTimeInSeconds,
      tags: [
        Caching.createOrganizationTag(
          OrganizationCacheKey.ApiKeys,
          ctx.organization.id
        )
      ]
    }
  )();
}
