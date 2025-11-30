import { redirect } from 'next/navigation';

export default async function LeadAnalyticsRedirect({ 
  params 
}: { 
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  // Redirect to the new unified Leads page with Analytics tab selected
  redirect(`/${locale}/admin/leads?tab=analytics`);
}