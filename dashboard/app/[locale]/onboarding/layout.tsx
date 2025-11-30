interface OnboardingLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function OnboardingLayout({
  children,
  params: _params
}: OnboardingLayoutProps) {
  // Onboarding translations are now loaded globally in the main layout
  return <>{children}</>;
}