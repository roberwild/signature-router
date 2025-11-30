import { redirect } from 'next/navigation';

export default function LeadScoringRedirect({ 
  params 
}: { 
  params: { locale: string } 
}) {
  // Redirect to the new unified Leads page with Scoring tab selected
  redirect(`/${params.locale}/admin/leads?tab=scoring`);
}