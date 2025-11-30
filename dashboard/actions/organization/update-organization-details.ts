'use server';

import { revalidateTag } from 'next/cache';

import { stripeServer } from '@workspace/billing/stripe-server';
import { db, eq } from '@workspace/database/client';
import { organizationTable } from '@workspace/database/schema';

import { authOrganizationActionClient } from '~/actions/safe-action';
import { Caching, OrganizationCacheKey, UserCacheKey } from '~/data/caching';
import { updateOrganizationDetailsSchema } from '~/schemas/organization/update-organization-details-schema';

export const updateOrganizationDetails = authOrganizationActionClient
  .metadata({ actionName: 'updateOrganizationDetails' })
  .schema(updateOrganizationDetailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .update(organizationTable)
      .set({
        name: parsedInput.name,
        address: parsedInput.address ? parsedInput.address : null,
        phone: parsedInput.phone ? parsedInput.phone : null,
        email: parsedInput.email ? parsedInput.email : null,
        website: parsedInput.website ? parsedInput.website : null
      })
      .where(eq(organizationTable.id, ctx.organization.id));

    if (ctx.organization.name !== ctx.organization.name) {
      if (ctx.organization.stripeCustomerId) {
        try {
          await stripeServer.customers.update(
            ctx.organization.stripeCustomerId,
            {
              name: parsedInput.name
            }
          );
        } catch (e) {
          console.error(e);
        }
      } else {
        console.warn('Stripe customer ID is missing');
      }
    }

    for (const membership of ctx.organization.memberships) {
      revalidateTag(
        Caching.createUserTag(UserCacheKey.Organizations, membership.userId)
      );
    }

    revalidateTag(
      Caching.createOrganizationTag(
        OrganizationCacheKey.OrganizationDetails,
        ctx.organization.id
      )
    );
  });
