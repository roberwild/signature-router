import * as React from 'react';
import {
  User,
  Palette,
  Building2,
  Users,
  Mail,
  Target,
  Check
} from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip';
import { useTranslations } from '~/hooks/use-translations';

import { OnboardingStep } from '~/schemas/onboarding/complete-onboarding-schema';

export type StepIndicatorEnhancedProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
  steps: OnboardingStep[];
  currentStep: OnboardingStep;
  setCurrentStep: (value: OnboardingStep) => void;
};

// Step icons configuration
const STEP_ICONS: Record<OnboardingStep, React.ComponentType<{ className?: string }>> = {
  [OnboardingStep.Profile]: User,
  [OnboardingStep.Theme]: Palette,
  [OnboardingStep.Organization]: Building2,
  [OnboardingStep.InviteTeam]: Users,
  [OnboardingStep.PendingInvitations]: Mail,
  [OnboardingStep.LeadQualification]: Target
};

export function StepIndicatorEnhanced({
  steps,
  currentStep,
  setCurrentStep,
  className,
  ...other
}: StepIndicatorEnhancedProps): React.JSX.Element {
  const { t } = useTranslations('onboarding');
  const currentStepIndex = steps.findIndex((step) => step === currentStep);

  // Step configuration with translations
  const getStepConfig = (step: OnboardingStep) => {
    // Convert kebab-case to camelCase for translation keys
    const stepKey = step.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return {
      icon: STEP_ICONS[step],
      label: t(`steps.${stepKey}.title`), // Full title for label
      description: t(`steps.${stepKey}.description`).split('.')[0] // Get first sentence for description
    };
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  const canNavigateToStep = (stepIndex: number) => {
    // Can only navigate to completed steps
    return stepIndex < currentStepIndex;
  };

  return (
    <TooltipProvider>
      <div className={cn('w-full', className)} {...other}>
        {/* Mobile view - Compact */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">
              {t('navigation.step')} {currentStepIndex + 1} {t('navigation.of')} {steps.length}
            </p>
            <span className="text-sm text-muted-foreground">
              {getStepConfig(currentStep).label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div
                  key={step}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all duration-300",
                    status === 'completed' && "bg-primary",
                    status === 'current' && "bg-primary animate-pulse",
                    status === 'upcoming' && "bg-muted"
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Desktop view - Full */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-0 top-5 h-0.5 w-full bg-muted">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ 
                  width: `${(currentStepIndex / (steps.length - 1)) * 100}%` 
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex items-center justify-between">
              {steps.map((step, index) => {
                const stepConfig = getStepConfig(step);
                const status = getStepStatus(index);
                const canNavigate = canNavigateToStep(index);
                const Icon = stepConfig?.icon || Building2;

                return (
                  <Tooltip key={step}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => canNavigate && setCurrentStep(step)}
                        disabled={!canNavigate}
                        className={cn(
                          "group flex flex-col items-center gap-2 transition-all duration-200",
                          canNavigate && "cursor-pointer hover:scale-105",
                          !canNavigate && "cursor-not-allowed"
                        )}
                      >
                        {/* Step circle */}
                        <div 
                          className={cn(
                            "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                            status === 'completed' && "border-primary bg-primary text-primary-foreground",
                            status === 'current' && "border-primary bg-background text-primary shadow-lg shadow-primary/25",
                            status === 'upcoming' && "border-muted bg-background text-muted-foreground",
                            canNavigate && "group-hover:shadow-md"
                          )}
                        >
                          {status === 'completed' ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>

                        {/* Step label */}
                        <div className="absolute top-14 flex flex-col items-center w-20">
                          <span
                            className={cn(
                              "text-xs font-medium text-center leading-tight transition-colors",
                              status === 'current' && "text-primary",
                              status === 'completed' && "text-foreground",
                              status === 'upcoming' && "text-muted-foreground"
                            )}
                          >
                            {stepConfig?.label}
                          </span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-semibold">{stepConfig?.label}</p>
                        <p className="text-xs">{stepConfig?.description}</p>
                        {status === 'completed' && (
                          <p className="text-xs text-green-500">✓ {t('navigation.completed') || 'Completado'}</p>
                        )}
                        {status === 'current' && (
                          <p className="text-xs text-primary">{t('navigation.inProgress') || 'En progreso'}</p>
                        )}
                        {canNavigate && (
                          <p className="text-xs text-muted-foreground">{t('navigation.clickToReturn') || 'Click para volver'}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current step info */}
        <div className="mt-12 md:mt-16 text-center">
          <h2 className="text-lg font-semibold flex items-center justify-center gap-2">
            {React.createElement(getStepConfig(currentStep)?.icon || Building2, {
              className: "h-5 w-5 text-primary"
            })}
            {getStepConfig(currentStep)?.label}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {getStepConfig(currentStep)?.description}
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}