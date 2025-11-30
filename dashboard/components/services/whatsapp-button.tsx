'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

interface WhatsAppButtonProps {
  serviceTitle: string;
  className?: string;
}

export function WhatsAppButton({ serviceTitle, className = "w-full" }: WhatsAppButtonProps) {
  const handleClick = () => {
    const message = encodeURIComponent(`Hola, me interesa obtener más información sobre ${serviceTitle}`);
    window.open(`https://api.whatsapp.com/send?phone=34919049788&text=${message}`, '_blank');
  };

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleClick}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Consultar por WhatsApp
    </Button>
  );
}