'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

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
import { TextEditor } from '@workspace/ui/components/text-editor';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { sendContactMessage, type ContactMessageInput } from '~/actions/services/send-contact-message';

interface ContactFormProps {
  organizationId: string;
}

export function ContactForm({ organizationId }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const _router = useRouter();
  
  const [formData, setFormData] = useState<ContactMessageInput>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});
    
    try {
      const result = await sendContactMessage(organizationId, formData);
      
      if (result.success) {
        setShowSuccess(true);
        // Clear form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } else {
        if (result.errors) {
          setValidationErrors(result.errors as Record<string, string[]>);
        } else {
          setError(result.message || 'Error al enviar el mensaje');
        }
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setError('No se pudo enviar el mensaje. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactMessageInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (showSuccess) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-900 dark:text-green-100">
            ¡Mensaje Enviado!
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            Hemos recibido tu mensaje correctamente. Nuestro equipo se pondrá en contacto contigo en las próximas 24-48 horas hábiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowSuccess(false)}
            className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950"
          >
            Enviar otro mensaje
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envíanos un mensaje</CardTitle>
        <CardDescription>
          Completa el formulario y nos pondremos en contacto contigo lo antes posible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="ml-6 mt-1">Error</AlertTitle>
              <AlertDescription className="mt-1">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Juan Pérez"
                required
                disabled={isSubmitting}
                className={validationErrors.name ? 'border-red-500' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name[0]}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="juan@empresa.com"
                required
                disabled={isSubmitting}
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email[0]}</p>
              )}
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+34 600 123 456"
              disabled={isSubmitting}
              className={validationErrors.phone ? 'border-red-500' : ''}
            />
            {validationErrors.phone && (
              <p className="text-sm text-red-500">{validationErrors.phone[0]}</p>
            )}
          </div>

          {/* Subject Field - Full Width */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Asunto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Consulta sobre servicios de ciberseguridad"
              required
              disabled={isSubmitting}
              className={validationErrors.subject ? 'border-red-500' : ''}
            />
            {validationErrors.subject && (
              <p className="text-sm text-red-500">{validationErrors.subject[0]}</p>
            )}
          </div>

          {/* Message Field with Rich Text Editor */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Mensaje <span className="text-red-500">*</span>
            </Label>
            <TextEditor
              getText={() => formData.message}
              setText={(text) => handleInputChange('message', text)}
              placeholder="Cuéntanos en qué podemos ayudarte..."
              height="200px"
            />
            {validationErrors.message && (
              <p className="text-sm text-red-500">{validationErrors.message[0]}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="text-red-500">*</span> Campos obligatorios
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar mensaje
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}