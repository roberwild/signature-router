'use client';

import { useState } from 'react';
import { Bot, PanelLeftClose, PanelLeft, Bug } from 'lucide-react';
import { ServicesChatbotV2 } from './services-chatbot-v2';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

// Interface for organization context
interface OrganizationContext {
  organization: {
    id: string;
    slug: string;
    name: string;
    [key: string]: unknown;
  };
  session: {
    user: {
      id: string;
      name?: string;
      email: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ChatbotPageWrapperProps {
  organizationContext: OrganizationContext;
}

export function ChatbotPageWrapper({ organizationContext }: ChatbotPageWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start with sidebar closed for cleaner initial view
  
  // Function to trigger debug info from child component
  const handleDebugClick = () => {
    // We'll trigger this via a custom event that the child component can listen to
    window.dispatchEvent(new CustomEvent('chatbot-debug-trigger'));
  };

  return (
    <Page className="h-screen overflow-hidden">
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            {/* Sidebar toggle button using lucide icons */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Ocultar conversaciones" : "Mostrar conversaciones"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <div className="h-4 w-px bg-border" />
            <Bot className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title="Asesor de Ciberseguridad"
              info="Chat con nuestro asesor de IA para encontrar las soluciones perfectas para tu organización"
            />
          </div>
          <PageActions>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDebugClick}
              title="Debug Info - Ver contexto del chatbot"
            >
              <Bug className="h-4 w-4" />
            </Button>
            <Link href={`/organizations/${organizationContext.organization.slug}/services`}>
              <Button variant="outline">
                Ver Servicios
              </Button>
            </Link>
            <Button variant="outline" asChild>
              <a href={`/organizations/${organizationContext.organization.slug}/services/contact`}>
                Contactar con Ventas
              </a>
            </Button>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody disableScroll className="flex-1 p-0 overflow-hidden">
        <ServicesChatbotV2
          organizationId={organizationContext.organization.id}
          organizationSlug={organizationContext.organization.slug}
          organizationName={organizationContext.organization.name}
          userId={organizationContext.session.user.id}
          userName={organizationContext.session.user.name || undefined}
          userEmail={organizationContext.session.user.email}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </PageBody>
    </Page>
  );
}