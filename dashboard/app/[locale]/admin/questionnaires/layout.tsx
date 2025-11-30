import { requirePlatformAdmin } from '~/middleware/admin';

export default async function QuestionnairesLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await requirePlatformAdmin();
  const { locale: _locale } = await params;
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}