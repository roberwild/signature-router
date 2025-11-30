import { db } from '@workspace/database';
import { questionConfigsTable } from '@workspace/database';
import { cache } from 'react';
import { eq, or, desc, asc, isNull } from 'drizzle-orm';

export type QuestionConfig = {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  category: string | null;
  priority: number;
  orderIndex: number;
  isCritical: boolean;
  enabled: boolean;
  metadata: unknown;
  updatedAt: Date;
};

export const getQuestionConfigs = cache(async (category?: string): Promise<QuestionConfig[]> => {
  const baseQuery = db
    .select()
    .from(questionConfigsTable)
    .orderBy(
      desc(questionConfigsTable.priority),
      asc(questionConfigsTable.orderIndex)
    );

  const questions = category
    ? await baseQuery.where(
        or(
          eq(questionConfigsTable.category, category),
          isNull(questionConfigsTable.category)
        )
      )
    : await baseQuery;

  return questions.map(q => ({
    id: q.id,
    questionId: q.questionId,
    questionText: q.questionText,
    questionType: q.questionType,
    category: q.category,
    priority: q.priority,
    orderIndex: q.orderIndex,
    isCritical: q.isCritical,
    enabled: q.enabled,
    metadata: q.metadata,
    updatedAt: q.updatedAt
  }));
});

export async function updateQuestionConfig(
  questionId: string,
  data: Partial<{
    priority: number;
    orderIndex: number;
    isCritical: boolean;
    enabled: boolean;
  }>,
  userId: string
) {
  const [updated] = await db
    .update(questionConfigsTable)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedBy: userId
    })
    .where(eq(questionConfigsTable.questionId, questionId))
    .returning();

  return updated;
}

export async function updateQuestionOrder(
  updates: { questionId: string; orderIndex: number }[],
  userId: string
) {
  const promises = updates.map(({ questionId, orderIndex }) =>
    db
      .update(questionConfigsTable)
      .set({
        orderIndex,
        updatedAt: new Date(),
        updatedBy: userId
      })
      .where(eq(questionConfigsTable.questionId, questionId))
  );

  await Promise.all(promises);
  return true;
}