'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';

import { CIS18ContactForm } from './cis18-contact-form';
import { TestDataButton } from './test-data-button';

interface EmptyStateCIS18Props {
  slug: string;
  organizationId: string;
  userId: string;
}

export function EmptyStateCIS18({ slug: _slug, organizationId, userId }: EmptyStateCIS18Props) {
  const [showContactForm, setShowContactForm] = useState(false);
  
  if (showContactForm) {
    return <CIS18ContactForm organizationId={organizationId} userId={userId} />;
  }
  
  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            No tienes auditoría CIS-18
          </CardTitle>
          <CardDescription>
            Descubre el nivel de madurez de tu organización con una auditoría externa basada en los 18 controles críticos de ciberseguridad
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Beneficios de la Auditoría CIS-18</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Evaluación completa de 18 controles críticos</li>
              <li>✓ Informe detallado con puntuaciones por control</li>
              <li>✓ Comparativa con estándares del sector</li>
              <li>✓ Plan de mejora personalizado</li>
              <li>✓ Certificación de cumplimiento</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Button size="lg" className="w-full max-w-sm" onClick={() => setShowContactForm(true)}>
              Estoy interesado
            </Button>
            {/* Temporary test data button for development */}
            <TestDataButton 
              organizationId={organizationId} 
              userId={userId}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Un especialista de Minery se pondrá en contacto contigo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}