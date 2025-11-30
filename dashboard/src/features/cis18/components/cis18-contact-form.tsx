'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, User, Building2, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';

interface CIS18ContactFormProps {
  organizationId: string;
  userId: string;
}

export function CIS18ContactForm({ organizationId, userId }: CIS18ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    companySize: '',
    preferredContactMethod: 'email',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cis18/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el formulario');
      }

      setShowSuccess(true);
      // Clear form
      setFormData({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        companyName: '',
        companySize: '',
        preferredContactMethod: 'email',
        message: '',
      });
      
      // Refresh the page after 3 seconds
      setTimeout(() => {
        router.refresh();
      }, 3000);
    } catch (error) {
      console.error('Error submitting lead form:', error);
      setError('No se pudo enviar el formulario. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">¡Solicitud Enviada!</CardTitle>
          <CardDescription>
            Hemos recibido tu solicitud. Un especialista de Minery se pondrá en contacto contigo en las próximas 24-48 horas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Solicitar Auditoría CIS-18</CardTitle>
        <CardDescription>
          Completa el formulario y un especialista se pondrá en contacto contigo para coordinar tu auditoría externa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Información de Contacto</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  <User className="inline h-3 w-3 mr-1" />
                  Nombre Completo *
                </Label>
                <Input
                  id="contactName"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  <Mail className="inline h-3 w-3 mr-1" />
                  Correo Electrónico *
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="juan@empresa.com"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  <Phone className="inline h-3 w-3 mr-1" />
                  Teléfono
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod">
                  Método de Contacto Preferido
                </Label>
                <Select
                  value={formData.preferredContactMethod}
                  onValueChange={(value) => setFormData({ ...formData, preferredContactMethod: value })}
                >
                  <SelectTrigger id="preferredContactMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Correo Electrónico</SelectItem>
                    <SelectItem value="phone">Teléfono</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Información de la Empresa</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  <Building2 className="inline h-3 w-3 mr-1" />
                  Nombre de la Empresa
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Mi Empresa S.A."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companySize">
                  Tamaño de la Empresa
                </Label>
                <Select
                  value={formData.companySize}
                  onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                >
                  <SelectTrigger id="companySize">
                    <SelectValue placeholder="Selecciona un rango" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 empleados</SelectItem>
                    <SelectItem value="11-50">11-50 empleados</SelectItem>
                    <SelectItem value="51-200">51-200 empleados</SelectItem>
                    <SelectItem value="201-500">201-500 empleados</SelectItem>
                    <SelectItem value="500+">Más de 500 empleados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Mensaje Adicional
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Cuéntanos más sobre tus necesidades de auditoría..."
              rows={4}
            />
          </div>
          
          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}