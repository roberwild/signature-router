import { cache } from 'react';
import { db, eq } from '@workspace/database/client';
import { leadQualificationTable } from '@workspace/database/schema';

export const getOrganizationQuestionnaireStatus = cache(
  async (organizationId: string): Promise<{ hasCompletedQuestionnaire: boolean }> => {
    const result = await db
      .select({ id: leadQualificationTable.id })
      .from(leadQualificationTable)
      .where(eq(leadQualificationTable.organizationId, organizationId))
      .limit(1);

    return {
      hasCompletedQuestionnaire: result.length > 0
    };
  }
);