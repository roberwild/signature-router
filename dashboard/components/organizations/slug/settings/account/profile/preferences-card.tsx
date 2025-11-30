'use client';

import * as React from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { useTranslations } from '~/hooks/use-translations';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@workspace/ui/components/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@workspace/ui/components/form';
import { RadioCardItem, RadioCards } from '@workspace/ui/components/radio-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/components/select';
import { Separator } from '@workspace/ui/components/separator';
import { toast } from '@workspace/ui/components/sonner';
import { useMounted } from '@workspace/ui/hooks/use-mounted';
import { useTheme, type Theme } from '@workspace/ui/hooks/use-theme';

import { updatePreferences } from '~/actions/account/update-preferences';
import { ThemeOption } from '~/components/organizations/slug/settings/account/profile/theme-option';
import { useZodForm } from '~/hooks/use-zod-form';
import {
  updatePreferencesSchema,
  type UpdatePreferencesSchema
} from '~/schemas/account/update-preferences-schema';
import type { PreferencesDto } from '~/types/dtos/preferences-dto';

export type PreferencesCardProps = CardProps & {
  preferences: PreferencesDto;
};

export function PreferencesCard({
  preferences,
  ...other
}: PreferencesCardProps): React.JSX.Element {
  const { t } = useTranslations('account');
  const { theme, setTheme } = useTheme();
  const isMounted = useMounted();
  const methods = useZodForm({
    schema: updatePreferencesSchema,
    mode: 'onSubmit',
    defaultValues: {
      locale: preferences.locale,
      theme: (theme as Theme) ?? 'system'
    }
  });
  const canSubmit = !methods.formState.isSubmitting;
  const onSubmit: SubmitHandler<UpdatePreferencesSchema> = async (values) => {
    if (!canSubmit) {
      return;
    }
    const result = await updatePreferences(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success(t('profile.preferences.messages.updateSuccess'));
      setTheme(values.theme);
    } else {
      toast.error(t('profile.preferences.messages.updateError'));
    }
  };
  return (
    <FormProvider {...methods}>
      <Card {...other}>
        <CardContent className="pt-6">
          <form
            className="space-y-8"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="locale"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>{t('profile.preferences.fields.language')}</FormLabel>
                  <FormDescription>
                    {t('profile.preferences.fields.languageDescription')}
                  </FormDescription>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={methods.formState.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">
                          <div className="flex flex-row items-center gap-2">
                            <UsFlag className="h-3 w-4" />
                            <span>English</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="es">
                          <div className="flex flex-row items-center gap-2">
                            <EsFlag className="h-3 w-4" />
                            <span>Español</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('profile.preferences.fields.theme')}</FormLabel>
                  <FormDescription>
                    {t('profile.preferences.fields.themeDescription')}
                  </FormDescription>
                  <FormControl>
                    <RadioCards
                      onValueChange={field.onChange}
                      value={isMounted ? field.value : undefined}
                      className="flex flex-row flex-wrap gap-4"
                      disabled={methods.formState.isSubmitting}
                    >
                      {(['light', 'dark', 'system'] as const).map((theme) => (
                        <RadioCardItem
                          key={theme}
                          value={theme}
                          className="border-none p-0 hover:bg-transparent data-[state=checked]:bg-transparent"
                          checkClassName="bottom-8 group-data-[state=checked]:bg-blue-500 group-data-[state=checked]:!border-blue-500"
                        >
                          <ThemeOption theme={theme} />{' '}
                        </RadioCardItem>
                      ))}
                    </RadioCards>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </CardContent>
        <Separator />
        <CardFooter className="flex w-full justify-end pt-6">
          <Button
            type="button"
            variant="default"
            size="default"
            disabled={!canSubmit}
            loading={methods.formState.isSubmitting}
            onClick={methods.handleSubmit(onSubmit)}
          >
            {t('profile.preferences.actions.save')}
          </Button>
        </CardFooter>
      </Card>
    </FormProvider>
  );
}

function UsFlag(props: React.SVGAttributes<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      {...props}
    >
      <path
        fill="#bd3d44"
        d="M0 0h640v480H0"
      />
      <path
        stroke="#fff"
        strokeWidth="37"
        d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"
      />
      <path
        fill="#192f5d"
        d="M0 0h364.8v258.5H0"
      />
      <marker
        id="us-a"
        markerHeight="30"
        markerWidth="30"
      >
        <path
          fill="#fff"
          d="M14 0l9 27L0 10h28L5 27z"
        />
      </marker>
      <path
        fill="none"
        markerMid="url(#us-a)"
        d="M0 0l16 11h61 61 61 61 60L47 37h61 61 60 61L16 63h61 61 61 61 60L47 89h61 61 60 61L16 115h61 61 61 61 60L47 141h61 61 60 61L16 166h61 61 61 61 60L47 192h61 61 60 61L16 218h61 61 61 61 60z"
      />
    </svg>
  );
}


function EsFlag(props: React.SVGAttributes<SVGSVGElement>): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      {...props}
    >
      <path
        fill="#c60b1e"
        d="M0 0h640v480H0z"
      />
      <path
        fill="#ffc400"
        d="M0 120h640v240H0z"
      />
    </svg>
  );
}
