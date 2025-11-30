'use client';

import * as React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Role } from '@workspace/database/schema';
import { Button } from '@workspace/ui/components/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/components/select';
import { cn } from '@workspace/ui/lib/utils';

import { NextButton } from '~/components/onboarding/next-button';
import type { OnboardingStepProps } from '~/components/onboarding/onboarding-step-props';
import { useTranslations } from '~/hooks/use-translations';
import { type CompleteOnboardingSchema } from '~/schemas/onboarding/complete-onboarding-schema';

export type OnboardingInvitationStepProps =
  React.HtmlHTMLAttributes<HTMLDivElement> & OnboardingStepProps;

export function OnboardingInviteTeamStep({
  canNext,
  loading,
  isLastStep,
  handleNext,
  className,
  ...other
}: OnboardingInvitationStepProps): React.JSX.Element {
  const { t } = useTranslations('onboarding');
  const methods = useFormContext<CompleteOnboardingSchema>();
  const { fields, append } = useFieldArray({
    control: methods.control,
    name: 'inviteTeamStep.invitations'
  });
  const handleAppendInvitation = (): void => {
    append({ email: '', role: Role.MEMBER });
  };
  return (
    <div
      className={cn('flex w-full flex-col gap-4', className)}
      {...other}
    >
      <h1 className="text-3xl font-medium">{t('steps.inviteTeam.title')}</h1>
      <p className="text-base text-muted-foreground">
        {t('steps.inviteTeam.description')}
      </p>
      <div className="flex flex-col space-y-2">
        <div className="flex h-9 flex-row items-center justify-between">
          <Label>{t('steps.inviteTeam.fields.email.label')}</Label>
          {fields.length < 5 && (
            <Button
              type="button"
              variant="link"
              onClick={handleAppendInvitation}
            >
              + {t('steps.inviteTeam.actions.addAnother')}
            </Button>
          )}
        </div>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-baseline space-x-2"
          >
            <FormField
              name={`inviteTeamStep.invitations.${index}.email`}
              control={methods.control}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      type="email"
                      maxLength={255}
                      placeholder={t('steps.inviteTeam.fields.email.placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name={`inviteTeamStep.invitations.${index}.role`}
              render={({ field }) => (
                <FormItem className="w-44">
                  <FormControl>
                    <Select
                      required
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Role).map((value) => (
                          <SelectItem
                            key={value}
                            value={value}
                          >
                            {t(`steps.inviteTeam.fields.role.options.${value.toLowerCase()}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
      <NextButton
        loading={loading}
        disabled={!canNext}
        isLastStep={isLastStep}
        onClick={handleNext}
      />
    </div>
  );
}
