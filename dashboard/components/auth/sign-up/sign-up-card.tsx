'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircleIcon, LockIcon, MailIcon, UserIcon } from 'lucide-react';
import { type SubmitHandler } from 'react-hook-form';

import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from '@workspace/ui/components/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider
} from '@workspace/ui/components/form';
import { InputPassword } from '@workspace/ui/components/input-password';
import { InputWithAdornments } from '@workspace/ui/components/input-with-adornments';
import { cn } from '@workspace/ui/lib/utils';

import { continueWithGoogle } from '~/actions/auth/continue-with-google';
import { continueWithMicrosoft } from '~/actions/auth/continue-with-microsoft';
import { signUp } from '~/actions/auth/sign-up';
import { OrContinueWith } from '~/components/auth/or-continue-with';
import { PasswordFormMessage } from '~/components/auth/password-form-message';
import { useZodForm } from '~/hooks/use-zod-form';
import GoogleLogo from '~/public/assets/logos/google-logo.svg';
import MicrosoftLogo from '~/public/assets/logos/microsoft-logo.svg';
import { signUpSchema, type SignUpSchema } from '~/schemas/auth/sign-up-schema';
import { useTranslations } from '~/hooks/use-translations';

interface SignUpCardProps extends CardProps {
  className?: string;
}

export function SignUpCard({
  className,
  ...other
}: SignUpCardProps): React.JSX.Element {
  const params = useParams();
  const locale = params?.locale as string || 'es';
  const { t } = useTranslations('auth');
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const methods = useZodForm({
    schema: signUpSchema,
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });
  const password = methods.watch('password');
  const onSubmit: SubmitHandler<SignUpSchema> = async (values) => {
    const result = await signUp(values);
    if (result?.serverError || result?.validationErrors) {
      if (result.validationErrors?.email?._errors?.[0]) {
        setErrorMessage(result.validationErrors?.email?._errors?.[0]);
      } else {
        setErrorMessage(t('signUp.errors.signUpError') || 'An error occurred during sign up.');
      }
    }
  };
  const handleSignInWithGoogle = async (): Promise<void> => {
    const result = await continueWithGoogle();
    if (result?.serverError || result?.validationErrors) {
      setErrorMessage(t('signUp.errors.googleError') || 'An error occurred during Google sign up.');
    }
  };
  const handleSignInWithMicrosoft = async (): Promise<void> => {
    const result = await continueWithMicrosoft();
    if (result?.serverError || result?.validationErrors) {
      setErrorMessage(t('signUp.errors.microsoftError') || 'An error occurred during Microsoft sign up.');
    }
  };
  return (
    <Card
      className={cn(
        'w-full px-4 py-2 border-transparent dark:border-border',
        className
      )}
      {...other}
    >
      <CardHeader>
        <CardTitle className="text-base lg:text-lg">
          {t('signUp.title') || 'Create your account'}
        </CardTitle>
        <CardDescription>
          {t('signUp.description') || 'Please fill in the details to get started.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormProvider {...methods}>
          <form
            className="flex flex-col gap-4"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormField
              control={methods.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>{t('signUp.name') || 'Name'}</FormLabel>
                  <FormControl>
                    <InputWithAdornments
                      type="text"
                      maxLength={64}
                      autoComplete="name"
                      disabled={methods.formState.isSubmitting}
                      startAdornment={<UserIcon className="size-4 shrink-0" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>{t('signUp.email') || 'Email'}</FormLabel>
                  <FormControl>
                    <InputWithAdornments
                      type="email"
                      maxLength={255}
                      autoComplete="username"
                      disabled={methods.formState.isSubmitting}
                      startAdornment={<MailIcon className="size-4 shrink-0" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col">
              <FormField
                control={methods.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('signUp.password') || 'Password'}</FormLabel>
                    <FormControl>
                      <InputPassword
                        maxLength={72}
                        autoCapitalize="off"
                        autoComplete="current-password"
                        disabled={methods.formState.isSubmitting}
                        startAdornment={
                          <LockIcon className="size-4 shrink-0" />
                        }
                        {...field}
                      />
                    </FormControl>
                    <PasswordFormMessage password={password} />
                  </FormItem>
                )}
              />
            </div>
            {errorMessage && (
              <Alert variant="destructive">
                <div className="flex flex-row items-center gap-2 text-sm">
                  <AlertCircleIcon className="size-[18px] shrink-0" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </div>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={methods.formState.isSubmitting}
              loading={methods.formState.isSubmitting}
            >
              {t('signUp.signUpButton') || 'Create account'}
            </Button>
          </form>
        </FormProvider>
        <OrContinueWith text={t('signUp.orContinueWith')} />
        <div className="flex flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex w-full flex-row items-center gap-2"
            disabled={methods.formState.isSubmitting}
            onClick={handleSignInWithGoogle}
          >
            <GoogleLogo
              width="20"
              height="20"
            />
            {t('signUp.continueWithGoogle') || 'Google'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex w-full flex-row items-center gap-2"
            disabled={methods.formState.isSubmitting}
            onClick={handleSignInWithMicrosoft}
          >
            <MicrosoftLogo
              width="20"
              height="20"
            />
            {t('signUp.continueWithMicrosoft') || 'Microsoft'}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-1 text-sm text-muted-foreground">
        <span>{t('signUp.haveAccount') || 'Already have an account?'}</span>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="text-foreground underline"
        >
          {t('signUp.signIn') || 'Sign in'}
        </Link>
      </CardFooter>
    </Card>
  );
}
