import { db } from '@workspace/database';
import { 
  behavioralTriggersTable, 
  triggerQuestionMappingTable,
  questionConfigsTable
} from '@workspace/database';
import { cache } from 'react';
import { eq } from 'drizzle-orm';

export type BehavioralTrigger = {
  id: string;
  triggerName: string;
  triggerType: string;
  triggerConditions: unknown;
  delayHours: number;
  enabled: boolean;
  updatedAt: Date;
  questionIds: string[];
  questions: Array<{
    questionId: string;
    questionText: string;
    orderIndex: number;
  }>;
};

export const getBehavioralTriggers = cache(async (): Promise<BehavioralTrigger[]> => {
  const triggers = await db
    .select()
    .from(behavioralTriggersTable)
    .orderBy(behavioralTriggersTable.triggerName);

  // Get questions for each trigger
  const triggersWithQuestions = await Promise.all(
    triggers.map(async (trigger) => {
      const mappings = await db
        .select({
          questionId: triggerQuestionMappingTable.questionId,
          orderIndex: triggerQuestionMappingTable.orderIndex
        })
        .from(triggerQuestionMappingTable)
        .where(eq(triggerQuestionMappingTable.triggerId, trigger.id))
        .orderBy(triggerQuestionMappingTable.orderIndex);

      // Get question details
      const questions = await Promise.all(
        mappings.map(async (mapping) => {
          const [questionConfig] = await db
            .select({
              questionText: questionConfigsTable.questionText
            })
            .from(questionConfigsTable)
            .where(eq(questionConfigsTable.questionId, mapping.questionId))
            .limit(1);

          return {
            questionId: mapping.questionId,
            questionText: questionConfig?.questionText || mapping.questionId,
            orderIndex: mapping.orderIndex
          };
        })
      );

      return {
        id: trigger.id,
        triggerName: trigger.triggerName,
        triggerType: trigger.triggerType,
        triggerConditions: trigger.triggerConditions,
        delayHours: trigger.delayHours || 0,
        enabled: trigger.enabled,
        updatedAt: trigger.updatedAt,
        questionIds: mappings.map(m => m.questionId),
        questions
      };
    })
  );

  return triggersWithQuestions;
});

export async function updateBehavioralTrigger(
  triggerId: string,
  data: {
    triggerConditions?: unknown;
    delayHours?: number;
    enabled?: boolean;
  },
  userId: string
) {
  const [updated] = await db
    .update(behavioralTriggersTable)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedBy: userId
    })
    .where(eq(behavioralTriggersTable.id, triggerId))
    .returning();

  return updated;
}

export async function createBehavioralTrigger(
  data: {
    triggerName: string;
    triggerType: string;
    triggerConditions: unknown;
    delayHours: number;
    enabled: boolean;
  },
  userId: string
) {
  const [created] = await db
    .insert(behavioralTriggersTable)
    .values({
      ...data,
      updatedBy: userId
    })
    .returning();

  return created;
}

export async function deleteBehavioralTrigger(triggerId: string) {
  await db
    .delete(behavioralTriggersTable)
    .where(eq(behavioralTriggersTable.id, triggerId));
  
  return true;
}

export async function updateTriggerQuestions(
  triggerId: string,
  questionIds: string[]
) {
  // Remove existing mappings
  await db
    .delete(triggerQuestionMappingTable)
    .where(eq(triggerQuestionMappingTable.triggerId, triggerId));

  // Add new mappings
  if (questionIds.length > 0) {
    const mappings = questionIds.map((questionId, index) => ({
      triggerId,
      questionId,
      orderIndex: index
    }));

    await db
      .insert(triggerQuestionMappingTable)
      .values(mappings);
  }

  return true;
}