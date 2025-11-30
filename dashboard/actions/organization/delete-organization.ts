'use server';

import { revalidateTag } from 'next/cache';

import { isOrganizationOwner } from '@workspace/auth/permissions';
import { deleteOrganizationFromStripe } from '@workspace/billing/organization';
import { ForbiddenError } from '@workspace/common/errors';
import { db, eq } from '@workspace/database/client';
import {
  membershipTable,
  organizationLogoTable,
  organizationTable
} from '@workspace/database/schema';

import { authOrganizationActionClient } from '~/actions/safe-action';
import { Caching, UserCacheKey } from '~/data/caching';

export const deleteOrganization = authOrganizationActionClient
  .metadata({ actionName: 'deleteOrganization' })
  .action(async ({ ctx }) => {
    const currentUserIsOwner = await isOrganizationOwner(
      ctx.session.user.id,
      ctx.organization.id
    );
    if (!currentUserIsOwner) {
      throw new ForbiddenError('Only owners can delete an organization.');
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(membershipTable)
        .where(eq(membershipTable.organizationId, ctx.organization.id));
      await tx
        .delete(organizationTable)
        .where(eq(organizationTable.id, ctx.organization.id));
      await tx
        .delete(organizationLogoTable)
        .where(eq(organizationLogoTable.organizationId, ctx.organization.id));
    });

    for (const membership of ctx.organization.memberships) {
      revalidateTag(
        Caching.createUserTag(UserCacheKey.Organizations, membership.userId)
      );
      revalidateTag(
        Caching.createUserTag(UserCacheKey.Profile, membership.userId)
      );
    }

    try {
      await deleteOrganizationFromStripe(ctx.organization.stripeCustomerId);
    } catch (e) {
      console.error(e);
    }
  });
