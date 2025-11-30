'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import {
  Eye,
  Code,
  Palette,
  Send,
  UserCheck,
  KeyRound,
  UserPlus,
  ShieldAlert,
  MessageSquare,
  XCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';

// Define template categories
const templateCategories = {
  authentication: {
    label: 'Autenticación',
    icon: KeyRound,
    templates: [
      'verify-email',
      'welcome',
      'password-reset',
      'email-change'
    ]
  },
  organization: {
    label: 'Organización',
    icon: UserPlus,
    templates: [
      'invitation',
      'revoked-invitation'
    ]
  },
  security: {
    label: 'Seguridad',
    icon: ShieldAlert,
    templates: [
      'security-alert'
    ]
  },
  communication: {
    label: 'Comunicación',
    icon: MessageSquare,
    templates: [
      'contact-message',
      'feedback'
    ]
  }
};

// Template configurations with sample data
interface TemplateConfig {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  sampleData: Record<string, string | number | boolean>;
  variables: string[];
  component?: string;
}

const templates: Record<string, TemplateConfig> = {
  'verify-email': {
    name: 'Verificar Email',
    description: 'Email de verificación con código OTP',
    icon: UserCheck,
    category: 'authentication',
    component: 'VerifyEmailAddressEmail',
    sampleData: {
      name: 'Juan Pérez',
      otp: '123456',
      verificationLink: 'https://minery-guard.vercel.app/verify?token=abc123'
    },
    variables: []
  },
  'welcome': {
    name: 'Bienvenida',
    description: 'Email de bienvenida para nuevos usuarios',
    icon: UserPlus,
    category: 'authentication',
    component: 'WelcomeEmail',
    sampleData: {
      appName: 'Minery Guard',
      name: 'María García',
      getStartedLink: 'https://minery-guard.vercel.app/dashboard'
    },
    variables: []
  },
  'password-reset': {
    name: 'Restablecer Contraseña',
    description: 'Email para recuperación de contraseña',
    icon: KeyRound,
    category: 'authentication',
    component: 'PasswordResetEmail',
    sampleData: {
      appName: 'Minery Guard',
      name: 'Carlos Rodríguez',
      resetPasswordLink: 'https://minery-guard.vercel.app/reset-password?token=xyz789'
    },
    variables: []
  },
  'email-change': {
    name: 'Cambio de Email',
    description: 'Confirmación de cambio de dirección de email',
    icon: RefreshCw,
    category: 'authentication',
    component: 'ConfirmEmailAddressChangeEmail',
    sampleData: {
      name: 'Ana Martínez',
      confirmLink: 'https://minery-guard.vercel.app/confirm-email?token=def456'
    },
    variables: []
  },
  'invitation': {
    name: 'Invitación',
    description: 'Invitación a unirse a una organización',
    icon: UserPlus,
    category: 'organization',
    component: 'InvitationEmail',
    sampleData: {
      appName: 'Minery Guard',
      invitedByName: 'Pedro Sánchez',
      invitedByEmail: 'pedro@mineryreport.com',
      organizationName: 'Minery Report S.L.',
      inviteLink: 'https://minery-guard.vercel.app/invite?token=ghi789'
    },
    variables: []
  },
  'revoked-invitation': {
    name: 'Invitación Revocada',
    description: 'Notificación de invitación revocada',
    icon: XCircle,
    category: 'organization',
    component: 'RevokedInvitationEmail',
    sampleData: {
      appName: 'Minery Guard',
      organizationName: 'Minery Report S.L.'
    },
    variables: []
  },
  'security-alert': {
    name: 'Alerta de Seguridad',
    description: 'Alerta de cambios en la cuenta',
    icon: ShieldAlert,
    category: 'security',
    component: 'ConnectedAccountSecurityAlertEmail',
    sampleData: {
      appName: 'Minery Guard',
      name: 'Laura Fernández',
      provider: 'Google OAuth',
      action: 'connected'
    },
    variables: []
  },
  'contact-message': {
    name: 'Mensaje de Contacto',
    description: 'Confirmación y notificación de mensajes',
    icon: MessageSquare,
    category: 'communication',
    component: 'ContactMessageEmail',
    sampleData: {
      name: 'Roberto Díaz',
      email: 'roberto@example.com',
      phone: '+34 600 123 456',
      subject: 'Consulta sobre servicios',
      message: 'Me gustaría obtener más información sobre sus servicios de ciberseguridad.',
      isConfirmation: false
    },
    variables: []
  },
  'feedback': {
    name: 'Feedback',
    description: 'Notificación de feedback recibido',
    icon: MessageSquare,
    category: 'communication',
    component: 'FeedbackEmail',
    sampleData: {
      appName: 'Minery Guard',
      organizationName: 'Tech Solutions S.L.',
      name: 'Isabel Moreno',
      email: 'isabel@techsolutions.com',
      category: 'Sugerencia',
      message: 'Sería útil tener exportación a PDF en los informes.'
    },
    variables: []
  }
};

export default function EmailTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('verify-email');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [customData, setCustomData] = useState<Record<string, Record<string, string | number | boolean>>>({});

  const currentTemplate = templates[selectedTemplate];

  // Merge sample data with custom data
  const templateData = {
    ...currentTemplate.sampleData,
    ...(customData[selectedTemplate] || {})
  } as Record<string, string | number | boolean>;

  const handleDataChange = (field: string, value: string | boolean) => {
    setCustomData(prev => ({
      ...prev,
      [selectedTemplate]: {
        ...(prev[selectedTemplate] || {}),
        [field]: value
      }
    }));
  };

  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{success?: boolean; message?: string} | null>(null);

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          data: templateData
        })
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: result.message || 'Email de prueba enviado correctamente'
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Error al enviar email de prueba'
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setTestResult({
        success: false,
        message: 'Error al conectar con el servidor'
      });
    } finally {
      setSendingTest(false);
    }

    // Clear result after 5 seconds
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Email</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y prueba todas las plantillas de email del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {testResult && (
            <Alert className={`py-2 px-4 ${testResult.success ? 'border-green-500' : 'border-red-500'}`}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className="ml-2">
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}
          <Button
            variant="outline"
            onClick={() => setShowCode(!showCode)}
          >
            <Code className="h-4 w-4 mr-2" />
            {showCode ? 'Ocultar Código' : 'Ver Código'}
          </Button>
          <Button
            onClick={handleSendTestEmail}
            disabled={sendingTest}
          >
            {sendingTest ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sendingTest ? 'Enviando...' : 'Enviar Prueba'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selector Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantillas Disponibles</CardTitle>
              <CardDescription>
                Selecciona una plantilla para previsualizar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-4">
                  {Object.entries(templateCategories).map(([catKey, category]) => (
                    <div key={catKey}>
                      <div className="flex items-center gap-2 mb-2">
                        <category.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      <div className="space-y-1 ml-6">
                        {category.templates.map((templateKey) => {
                          const template = templates[templateKey];
                          const Icon = template.icon;
                          const isSelected = selectedTemplate === templateKey;

                          return (
                            <button
                              key={templateKey}
                              onClick={() => setSelectedTemplate(templateKey)}
                              className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm">{template.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(currentTemplate.icon, { className: "h-6 w-6 text-yellow-600" })}
                  <div>
                    <CardTitle>{currentTemplate.name}</CardTitle>
                    <CardDescription>{currentTemplate.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-50">
                  {currentTemplate.component}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs for Preview and Settings */}
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </TabsTrigger>
              <TabsTrigger value="data">
                <Palette className="h-4 w-4 mr-2" />
                Datos de Prueba
              </TabsTrigger>
              <TabsTrigger value="info">
                <AlertCircle className="h-4 w-4 mr-2" />
                Información
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Vista Previa del Email</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={previewMode === 'desktop' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('desktop')}
                      >
                        Desktop
                      </Button>
                      <Button
                        size="sm"
                        variant={previewMode === 'mobile' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('mobile')}
                      >
                        Mobile
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`mx-auto ${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
                    {/* Email Preview IFrame */}
                    <div className="bg-gray-50 rounded-lg p-4 min-h-[600px] relative">
                      <iframe
                        src={`/api/admin/email-preview?template=${selectedTemplate}&data=${encodeURIComponent(JSON.stringify(templateData))}`}
                        className="w-full h-[600px] rounded border bg-white"
                        title="Email Preview"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personalizar Datos de Prueba</CardTitle>
                  <CardDescription>
                    Modifica los valores para previsualizar diferentes escenarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.entries(currentTemplate.sampleData).map(([field, _value]) => (
                      <div key={field} className="grid gap-2">
                        <Label htmlFor={field}>
                          {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        {field === 'action' ? (
                          <Select
                            value={String(templateData[field])}
                            onValueChange={(value) => handleDataChange(field, value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="connected">Conectado</SelectItem>
                              <SelectItem value="disconnected">Desconectado</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : field === 'isConfirmation' ? (
                          <Select
                            value={String(templateData[field])}
                            onValueChange={(value) => handleDataChange(field, value === 'true')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Confirmación</SelectItem>
                              <SelectItem value="false">Notificación</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : field === 'message' ? (
                          <textarea
                            id={field}
                            value={String(templateData[field])}
                            onChange={(e) => handleDataChange(field, e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        ) : (
                          <Input
                            id={field}
                            value={String(templateData[field])}
                            onChange={(e) => handleDataChange(field, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        onClick={() => setCustomData({})}
                      >
                        Restablecer Valores
                      </Button>
                      <Button
                        onClick={() => {
                          // Force refresh preview with current data
                          const iframe = document.querySelector('iframe');
                          if (iframe) {
                            iframe.src = `/api/admin/email-preview?template=${selectedTemplate}&data=${encodeURIComponent(JSON.stringify(templateData))}`;
                          }
                        }}
                      >
                        Actualizar Vista Previa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información de la Plantilla</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Componente React</h3>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                      {currentTemplate.component}
                    </code>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Categoría</h3>
                    <Badge>{templateCategories[currentTemplate.category as keyof typeof templateCategories]?.label}</Badge>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Campos de Datos</h3>
                    <div className="space-y-1">
                      {Object.keys(currentTemplate.sampleData).map(field => (
                        <div key={field} className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {field}
                          </code>
                          <span className="text-xs text-muted-foreground">
                            {typeof currentTemplate.sampleData[field]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Uso</h3>
                    <p className="text-sm text-muted-foreground">
                      Esta plantilla se utiliza automáticamente cuando {' '}
                      {selectedTemplate === 'verify-email' && 'un usuario necesita verificar su email'}
                      {selectedTemplate === 'welcome' && 'un usuario completa el registro'}
                      {selectedTemplate === 'password-reset' && 'un usuario solicita restablecer su contraseña'}
                      {selectedTemplate === 'email-change' && 'un usuario cambia su dirección de email'}
                      {selectedTemplate === 'invitation' && 'se invita a un usuario a una organización'}
                      {selectedTemplate === 'revoked-invitation' && 'se revoca una invitación'}
                      {selectedTemplate === 'security-alert' && 'hay cambios en la seguridad de la cuenta'}
                      {selectedTemplate === 'contact-message' && 'se recibe un mensaje de contacto'}
                      {selectedTemplate === 'feedback' && 'se recibe feedback del sistema'}
                    </p>
                  </div>

                  {showCode && (
                    <div>
                      <h3 className="font-medium mb-2">Código de Ejemplo</h3>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                        <code>
{`import { ${currentTemplate.component} } from '@workspace/email/templates';

// Enviar email
await send${currentTemplate.component}({
  recipient: 'usuario@ejemplo.com',
  ${Object.entries(currentTemplate.sampleData)
    .map(([key, value]) => `  ${key}: ${typeof value === 'string' ? `'${value}'` : value}`)
    .join(',\n')}
});`}
                        </code>
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}