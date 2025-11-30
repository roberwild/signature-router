import { db } from '@workspace/database';
import { questionnaireGlobalSettingsTable } from '@workspace/database';
import { cache } from 'react';
import { eq } from 'drizzle-orm';

export type GlobalSetting = {
  id: string;
  settingKey: string;
  settingValue: unknown;
  description: string | null;
  updatedAt: Date;
};

export type GlobalSettingsConfig = {
  maxQuestionsPerSession: number;
  snoozeDurationOptions: string[];
  permanentDismissThreshold: number;
  defaultChannel: string;
  questionTimeoutMinutes: number;
  sessionTimeoutMinutes: number;
};

const DEFAULT_SETTINGS: GlobalSettingsConfig = {
  maxQuestionsPerSession: 3,
  snoozeDurationOptions: ['1h', '4h', '1d', '3d', '1w'],
  permanentDismissThreshold: 3,
  defaultChannel: 'platform',
  questionTimeoutMinutes: 5,
  sessionTimeoutMinutes: 30
};

export const getGlobalSettings = cache(async (): Promise<GlobalSettingsConfig> => {
  const settings = await db
    .select()
    .from(questionnaireGlobalSettingsTable)
    .orderBy(questionnaireGlobalSettingsTable.settingKey);

  const settingsMap = new Map(
    settings.map(s => [s.settingKey, s.settingValue])
  );

  return {
    maxQuestionsPerSession: Number(settingsMap.get('max_questions_per_session') ?? DEFAULT_SETTINGS.maxQuestionsPerSession),
    snoozeDurationOptions: Array.isArray(settingsMap.get('snooze_duration_options')) 
      ? settingsMap.get('snooze_duration_options') as string[]
      : DEFAULT_SETTINGS.snoozeDurationOptions,
    permanentDismissThreshold: Number(settingsMap.get('permanent_dismiss_threshold') ?? DEFAULT_SETTINGS.permanentDismissThreshold),
    defaultChannel: (settingsMap.get('default_channel') as string) ?? DEFAULT_SETTINGS.defaultChannel,
    questionTimeoutMinutes: Number(settingsMap.get('question_timeout_minutes') ?? DEFAULT_SETTINGS.questionTimeoutMinutes),
    sessionTimeoutMinutes: Number(settingsMap.get('session_timeout_minutes') ?? DEFAULT_SETTINGS.sessionTimeoutMinutes)
  };
});

export async function updateGlobalSetting(
  settingKey: string,
  settingValue: unknown,
  userId: string
) {
  const [updated] = await db
    .update(questionnaireGlobalSettingsTable)
    .set({
      settingValue,
      updatedAt: new Date(),
      updatedBy: userId
    })
    .where(eq(questionnaireGlobalSettingsTable.settingKey, settingKey))
    .returning();

  return updated;
}

export async function updateMultipleSettings(
  settings: { settingKey: string; settingValue: unknown }[],
  userId: string
) {
  const promises = settings.map(({ settingKey, settingValue }) =>
    updateGlobalSetting(settingKey, settingValue, userId)
  );

  await Promise.all(promises);
  return true;
}

export async function resetSettingsToDefaults(userId: string) {
  const settingsToUpdate = [
    { settingKey: 'max_questions_per_session', settingValue: DEFAULT_SETTINGS.maxQuestionsPerSession },
    { settingKey: 'snooze_duration_options', settingValue: DEFAULT_SETTINGS.snoozeDurationOptions },
    { settingKey: 'permanent_dismiss_threshold', settingValue: DEFAULT_SETTINGS.permanentDismissThreshold },
    { settingKey: 'default_channel', settingValue: DEFAULT_SETTINGS.defaultChannel },
    { settingKey: 'question_timeout_minutes', settingValue: DEFAULT_SETTINGS.questionTimeoutMinutes },
    { settingKey: 'session_timeout_minutes', settingValue: DEFAULT_SETTINGS.sessionTimeoutMinutes }
  ];

  await updateMultipleSettings(settingsToUpdate, userId);
  return DEFAULT_SETTINGS;
}