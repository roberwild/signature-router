import { db } from '@workspace/database';
import { timingStrategiesTable } from '@workspace/database';
import { cache } from 'react';
import { eq } from 'drizzle-orm';

export type TimingStrategy = {
  id: string;
  category: string;
  initialWaitDays: number;
  cooldownHours: number;
  maxSessionsPerWeek: number;
  enabled: boolean;
  updatedAt: Date;
};

export const getTimingStrategies = cache(async (): Promise<TimingStrategy[]> => {
  const strategies = await db
    .select()
    .from(timingStrategiesTable)
    .orderBy(timingStrategiesTable.category);

  return strategies.map(strategy => ({
    id: strategy.id,
    category: strategy.category,
    initialWaitDays: strategy.initialWaitDays,
    cooldownHours: strategy.cooldownHours,
    maxSessionsPerWeek: strategy.maxSessionsPerWeek,
    enabled: strategy.enabled,
    updatedAt: strategy.updatedAt
  }));
});

export async function updateTimingStrategy(
  category: string,
  data: {
    initialWaitDays: number;
    cooldownHours: number;
    maxSessionsPerWeek: number;
    enabled?: boolean;
  },
  userId: string
) {
  const [updated] = await db
    .update(timingStrategiesTable)
    .set({
      ...data,
      updatedAt: new Date(),
      updatedBy: userId
    })
    .where(eq(timingStrategiesTable.category, category))
    .returning();

  return updated;
}