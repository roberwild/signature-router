'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { ServiceRequestModal } from './service-request-modal';

interface ServiceRequestButtonProps {
  service: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  organizationId: string;
  organizationSlug: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ServiceRequestButton({ 
  service, 
  user, 
  organizationId, 
  organizationSlug,
  className = "w-full",
  size = "lg"
}: ServiceRequestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        className={className} 
        size={size} 
        onClick={() => setIsModalOpen(true)}
      >
        <Briefcase className="mr-2 h-4 w-4" />
        Solicitar este servicio
      </Button>
      
      {isModalOpen && (
        <ServiceRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          service={service}
          user={user}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />
      )}
    </>
  );
}