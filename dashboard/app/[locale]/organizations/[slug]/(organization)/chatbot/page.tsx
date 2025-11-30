import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import { ChatbotPageWrapper } from '../../../../../../components/chatbot/chatbot-page-wrapper';

export const metadata: Metadata = {
  title: 'Asesor de Ciberseguridad V2 | Minery',
  description: 'Chat con nuestro asesor de ciberseguridad impulsado por IA para encontrar las soluciones perfectas para tu organización.',
};

export default async function ChatbotPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const organizationContext = await getAuthOrganizationContext();
  
  if (!organizationContext) {
    redirect(`/${params.locale}/dashboard`);
  }

  return (
    <ChatbotPageWrapper
      organizationContext={organizationContext}
    />
  );
}