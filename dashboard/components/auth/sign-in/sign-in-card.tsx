'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  LockIcon,
  MailIcon
} from 'lucide-react';

import { AuthErrorCode } from '@workspace/auth/errors';
import { routes } from '@workspace/routes';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Button, buttonVariants } from '@workspace/ui/components/button';
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
import { toast } from '@workspace/ui/components/sonner';
import { cn } from '@workspace/ui/lib/utils';

import { continueWithGoogle } from '~/actions/auth/continue-with-google';
import { continueWithMicrosoft } from '~/actions/auth/continue-with-microsoft';
import { signInWithCredentials } from '~/actions/auth/sign-in-with-credentials';
import { OrContinueWith } from '~/components/auth/or-continue-with';
import { useZodForm } from '~/hooks/use-zod-form';
import { authErrorLabels } from '~/lib/labels';
import GoogleLogo from '~/public/assets/logos/google-logo.svg';
import MicrosoftLogo from '~/public/assets/logos/microsoft-logo.svg';
import {
  passThroughCredentialsSchema,
  type PassThroughCredentialsSchema
} from '~/schemas/auth/pass-through-credentials-schema';
import { useTranslations } from '~/hooks/use-translations';

interface SignInCardProps extends CardProps {
  className?: string;
}

export function SignInCard({
  className,
  ...other
}: SignInCardProps): React.JSX.Element {
  const params = useParams();
  const locale = params?.locale as string || 'es';
  const { t } = useTranslations('auth');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [unverifiedEmail, setUnverifiedEmail] = React.useState<
    string | undefined
  >();
  const methods = useZodForm({
    // We pass through the values and do not validate on the client-side
    // Reason: Would be bad UX to validate fields, unexpected behavior at this spot
    schema: passThroughCredentialsSchema,
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const canSubmit = !isLoading && !methods.formState.isSubmitting;
  const onSubmit = async (
    values: PassThroughCredentialsSchema
  ): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    console.log('[SignInCard] Submitting sign in for:', values.email);
    const result = await signInWithCredentials(values);
    console.log('[SignInCard] Sign in result:', result);
    console.log('[SignInCard] Result data:', result?.data);

    // Check if we need to redirect to verification page
    // next-safe-action returns data in result.data
    if (result?.data?.redirect && result?.data?.redirectTo) {
      console.log('[SignInCard] Redirecting to:', result.data.redirectTo);
      console.log('[SignInCard] With email:', result.data.email);
      // Build the URL with email parameter, locale, and from=signin flag
      const baseUrl = `/${locale}${result.data.redirectTo}`;
      const redirectUrl = result.data.email
        ? `${baseUrl}?email=${encodeURIComponent(result.data.email)}&from=signin`
        : baseUrl;
      console.log('[SignInCard] Final redirect URL:', redirectUrl);
      // Use window.location for proper redirect with search params
      window.location.href = redirectUrl;
      return;
    }

    if (result?.validationErrors?._errors) {
      console.log('[SignInCard] Validation errors:', result.validationErrors._errors);
      const errorCode = result.validationErrors._errors[0] as AuthErrorCode;

      setUnverifiedEmail(
        errorCode === AuthErrorCode.UnverifiedEmail ? values.email : undefined
      );
      setErrorMessage(
        authErrorLabels[
          errorCode in authErrorLabels ? errorCode : AuthErrorCode.UnknownError
        ]
      );

      setIsLoading(false);
    } else if (result?.serverError) {
      console.log('[SignInCard] Server error:', result.serverError);
      setUnverifiedEmail(undefined);
      setErrorMessage(result.serverError);
      setIsLoading(false);
    } else {
      console.log('[SignInCard] No errors, no redirect - unexpected state');
    }
  };
  const handleSignInWithGoogle = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    const result = await continueWithGoogle();
    if (result?.serverError || result?.validationErrors) {
      toast.error(t('signIn.errors.googleError') || "Couldn't continue with Google");
    }
    setIsLoading(false);
  };
  const handleSignInWithMicrosoft = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setIsLoading(true);
    const result = await continueWithMicrosoft();
    if (result?.serverError || result?.validationErrors) {
      toast.error(t('signIn.errors.microsoftError') || "Couldn't continue with Microsoft");
    }
    setIsLoading(false);
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
          {t('signIn.title') || 'Sign in to your account'}
        </CardTitle>
        <CardDescription>
          {t('signIn.description') || 'Welcome back! Please sign in to continue.'}
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
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('signIn.email') || 'Email'}</FormLabel>
                  <FormControl>
                    <InputWithAdornments
                      {...field}
                      type="email"
                      maxLength={255}
                      autoCapitalize="off"
                      autoComplete="username"
                      startAdornment={<MailIcon className="size-4 shrink-0" />}
                      disabled={methods.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('signIn.password') || 'Password'}</FormLabel>
                  <FormControl>
                    <InputPassword
                      {...field}
                      maxLength={72}
                      autoCapitalize="off"
                      autoComplete="current-password"
                      startAdornment={<LockIcon className="size-4 shrink-0" />}
                      disabled={methods.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                  <Link
                    href={routes.dashboard.auth.forgetPassword.Index}
                    className="mt-2 inline-block text-sm text-muted-foreground hover:text-primary underline underline-offset-2"
                  >
                    {t('signIn.forgotPassword') || 'Forgot password?'}
                  </Link>
                </FormItem>
              )}
            />
            {errorMessage && (
              <Alert variant="destructive">
                <div className="flex flex-row items-center gap-2">
                  <AlertCircleIcon className="size-[18px] shrink-0" />
                  <AlertDescription>
                    {errorMessage}
                    {unverifiedEmail && (
                      <Link
                        href={`${routes.dashboard.auth.verifyEmail.Index}?email=${encodeURIComponent(unverifiedEmail)}`}
                        className={cn(
                          buttonVariants({ variant: 'link' }),
                          'ml-0.5 h-fit gap-0.5 px-0.5 py-0 text-foreground underline'
                        )}
                      >
                        {t('signIn.verifyEmail') || 'Verify email'}
                        <ArrowRightIcon className="size-3 shrink-0" />
                      </Link>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            <Button
              type="submit"
              variant="default"
              className="w-full relative"
              disabled={!canSubmit}
              loading={methods.formState.isSubmitting}
              onClick={methods.handleSubmit(onSubmit)}
            >
              {t('signIn.signInButton') || 'Sign in'}
            </Button>
          </form>
        </FormProvider>
        <OrContinueWith text={t('signIn.orContinueWith')} />
        <div className="flex flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex w-full flex-row items-center gap-2"
            disabled={!canSubmit}
            onClick={handleSignInWithGoogle}
          >
            <GoogleLogo
              width="20"
              height="20"
            />
            {t('signIn.continueWithGoogle') || 'Google'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex w-full flex-row items-center gap-2"
            disabled={!canSubmit}
            onClick={handleSignInWithMicrosoft}
          >
            <MicrosoftLogo
              width="20"
              height="20"
            />
            {t('signIn.continueWithMicrosoft') || 'Microsoft'}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-1 text-sm text-muted-foreground">
        <span>{t('signIn.noAccount') || "Don't have an account?"}</span>
        <Link
          href={`/${locale}/auth/sign-up`}
          className="text-foreground underline"
        >
          {t('signIn.signUp') || 'Sign up'}
        </Link>
      </CardFooter>
    </Card>
  );
}
