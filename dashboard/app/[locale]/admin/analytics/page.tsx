import { redirect } from 'next/navigation';

export default function AnalyticsPage() {
  // Redirect to lead analytics as the main analytics page
  redirect('/admin/analytics/leads');
}