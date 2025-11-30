'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  ArrowLeft,
  FileText,
  Copy,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
  Phone,
  Bell,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { getApiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';

interface ProviderTemplate {
  id: string;
  template_name: string;
  provider_type: 'SMS' | 'PUSH' | 'VOICE' | 'BIOMETRIC';
  description: string;
  default_endpoint: string;
  authentication_type: string;
  required_fields: Array<{
    field_name: string;
    field_label: string;
    field_type: string;
    required: boolean;
    placeholder?: string;
  }>;
  optional_fields: Array<{
    field_name: string;
    field_label: string;
    field_type: string;
    default_value?: any;
  }>;
  documentation_url: string;
}

export default function ProviderTemplatesPage() {
  const { toast } = useToast();
  const apiClient = getApiClient();
  
  const [templates, setTemplates] = useState<ProviderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [selectedType]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await apiClient.getProviderTemplates(selectedType || undefined);
      setTemplates(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      SMS: MessageSquare,
      PUSH: Bell,
      VOICE: Phone,
      BIOMETRIC: Shield,
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      SMS: 'bg-blue-500/10 text-blue-700 border-blue-200',
      PUSH: 'bg-purple-500/10 text-purple-700 border-purple-200',
      VOICE: 'bg-orange-500/10 text-orange-700 border-orange-200',
      BIOMETRIC: 'bg-green-500/10 text-green-700 border-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const handleUseTemplate = (template: ProviderTemplate) => {
    // Redirigir a la página de providers con el template pre-seleccionado
    // En una implementación real, esto abriría el modal de creación con el template
    window.location.href = `/admin/providers?template=${template.id}`;
  };

  return (
    <div className="min-h-screen bg-singular-gray dark:bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/admin/providers'}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <AdminPageTitle
                  title="Templates de Proveedores"
                  info="Plantillas pre-configuradas para crear providers rápidamente"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Filtros por tipo */}
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedType === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                Todos
              </Button>
              {['SMS', 'PUSH', 'VOICE', 'BIOMETRIC'].map((type) => {
                const Icon = getTypeIcon(type);
                return (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {type}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando templates...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const TypeIcon = getTypeIcon(template.provider_type);
              return (
                <Card key={template.id} className="bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <TypeIcon className="h-5 w-5" />
                          {template.template_name}
                        </CardTitle>
                        <Badge variant="outline" className={getTypeColor(template.provider_type)}>
                          {template.provider_type}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Authentication Type */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Autenticación</span>
                      <Badge variant="outline" className="text-xs">
                        {template.authentication_type}
                      </Badge>
                    </div>

                    {/* Required Fields Count */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Campos requeridos</p>
                        <p className="text-lg font-bold">{template.required_fields.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Campos opcionales</p>
                        <p className="text-lg font-bold">{template.optional_fields.length}</p>
                      </div>
                    </div>

                    {/* Endpoint Preview */}
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
                      <p className="text-xs font-mono truncate">{template.default_endpoint}</p>
                    </div>

                    {/* Required Fields List */}
                    <div>
                      <p className="text-sm font-medium mb-2">Campos requeridos:</p>
                      <ul className="space-y-1">
                        {template.required_fields.slice(0, 3).map((field) => (
                          <li key={field.field_name} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {field.field_label}
                          </li>
                        ))}
                        {template.required_fields.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{template.required_fields.length - 3} más
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Usar Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(template.documentation_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <Card className="bg-white dark:bg-card shadow-sm">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No se encontraron templates</p>
              <p className="text-sm text-muted-foreground">
                {selectedType
                  ? `No hay templates disponibles para el tipo ${selectedType}`
                  : 'No hay templates disponibles en este momento'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

