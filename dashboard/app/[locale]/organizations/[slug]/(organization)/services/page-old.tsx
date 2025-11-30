import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { 
  Shield, 
  Search, 
  Briefcase, 
  UserCheck, 
  AlertTriangle,
  FileSearch,
  ShieldCheck,
  Users,
  ArrowRight,
  MessageCircle,
  Star,
  TrendingUp,
  Lock
} from 'lucide-react';

import { auth } from '@workspace/auth';
import { getAuthOrganizationContext } from '@workspace/auth/context';
import {
  Page,
  PageActions,
  PageBody,
  PageHeader,
  PagePrimaryBar,
} from '@workspace/ui/components/page';
import { OrganizationPageTitle } from '~/components/organizations/slug/organization-page-title';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';

export const metadata: Metadata = {
  title: 'Servicios Adicionales | Minery',
  description: 'Descubre servicios especializados de ciberseguridad para fortalecer tu organización',
};

interface ServicesPageProps {
  params: {
    slug: string;
  };
}

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'assessment' | 'testing' | 'managed' | 'incident';
  pricing: 'contact' | 'quote' | 'fixed';
  features: string[];
  popular?: boolean;
}

const services: ServiceCard[] = [
  {
    id: 'maturity-analysis',
    title: 'Análisis de Madurez en Ciberseguridad',
    description: 'Evaluación completa del nivel de madurez en ciberseguridad de tu organización con roadmap de mejora personalizado.',
    icon: ShieldCheck,
    category: 'assessment',
    pricing: 'quote',
    features: [
      'Evaluación exhaustiva de capacidades',
      'Benchmarking sectorial',
      'Roadmap de mejora priorizado',
      'Informe ejecutivo detallado'
    ],
    popular: true
  },
  {
    id: 'pen-test',
    title: 'Pentest',
    description: 'Pruebas de penetración profesionales para identificar vulnerabilidades en tus sistemas antes que los atacantes.',
    icon: Search,
    category: 'testing',
    pricing: 'quote',
    features: [
      'Test de infraestructura externa/interna',
      'Análisis de aplicaciones web',
      'Ingeniería social controlada',
      'Informe técnico y ejecutivo'
    ]
  },
  {
    id: 'managed-security',
    title: 'Departamento Externalizado de Ciberseguridad',
    description: 'Equipo completo de seguridad gestionado que actúa como tu departamento interno de ciberseguridad.',
    icon: Users,
    category: 'managed',
    pricing: 'contact',
    features: [
      'SOC 24/7',
      'Gestión de incidentes',
      'Cumplimiento normativo',
      'Formación continua del personal'
    ]
  },
  {
    id: 'ciso-service',
    title: 'CISO-as-a-Service',
    description: 'Accede a un CISO experimentado sin el coste de un ejecutivo a tiempo completo.',
    icon: UserCheck,
    category: 'managed',
    pricing: 'contact',
    features: [
      'Estrategia de seguridad',
      'Gobierno y cumplimiento',
      'Reporting a dirección',
      'Gestión de riesgos'
    ],
    popular: true
  },
  {
    id: 'forensic-analysis',
    title: 'Análisis Forense',
    description: 'Investigación forense digital para determinar el alcance y origen de incidentes de seguridad.',
    icon: FileSearch,
    category: 'incident',
    pricing: 'quote',
    features: [
      'Recolección de evidencias',
      'Análisis de malware',
      'Timeline de incidentes',
      'Soporte legal'
    ]
  },
  {
    id: 'incident-response',
    title: 'Respuesta Rápida ante Incidentes',
    description: 'Respuesta inmediata de emergencia ante incidentes de seguridad activos.',
    icon: AlertTriangle,
    category: 'incident',
    pricing: 'contact',
    features: [
      'Respuesta 24/7',
      'Contención inmediata',
      'Recuperación de sistemas',
      'Análisis post-incidente'
    ]
  }
];

const categoryColors = {
  assessment: 'bg-blue-500/10 text-blue-600',
  testing: 'bg-purple-500/10 text-purple-600',
  managed: 'bg-green-500/10 text-green-600',
  incident: 'bg-red-500/10 text-red-600'
};

const categoryLabels = {
  assessment: 'Evaluación',
  testing: 'Testing',
  managed: 'Gestionado',
  incident: 'Incidentes'
};

export default async function ServicesPage({ params }: ServicesPageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get organization from auth context
  const _ctx = await getAuthOrganizationContext();

  return (
    <Page>
      <PageHeader>
        <PagePrimaryBar>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <OrganizationPageTitle
              title="Servicios Adicionales"
              info="Servicios especializados de ciberseguridad para fortalecer tu organización"
            />
          </div>
          <PageActions>
            <Button variant="outline" asChild>
              <a href={`/organizations/${slug}/services/contact`}>
                Contactar con Ventas
              </a>
            </Button>
          </PageActions>
        </PagePrimaryBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Hero Section with CTAs */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 md:p-12">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold tracking-tight mb-2">
                    Fortalece tu Ciberseguridad Hoy
                  </h2>
                  <p className="text-lg text-muted-foreground mb-4">
                    Protege tu organización con servicios especializados de ciberseguridad. 
                    Desde auditorías hasta respuesta ante incidentes.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" variant="default" asChild>
                      <a href="https://api.whatsapp.com/send?phone=34919049788" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contactar por WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-center p-6 bg-background/60 backdrop-blur rounded-lg border">
                  <Lock className="h-12 w-12 text-primary mb-2" />
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Seguro</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">2018</p>
                <p className="text-sm text-muted-foreground">Fundación</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">15+</p>
                <p className="text-sm text-muted-foreground">Años Experiencia</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">CIS</p>
                <p className="text-sm text-muted-foreground">Partner Oficial</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="p-0">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">900+</p>
                <p className="text-sm text-muted-foreground">Profesionales ECIJA</p>
              </CardContent>
            </Card>
          </div>

          {/* Services Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.id} className="relative hover:shadow-lg transition-shadow flex flex-col h-full">
                  {service.popular && (
                    <Badge className="absolute -top-2 -right-2 z-10" variant="default">
                      Popular
                    </Badge>
                  )}
                  <CardHeader className="flex-none">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="h-8 w-8 text-primary" />
                      <Badge 
                        variant="secondary" 
                        className={categoryColors[service.category]}
                      >
                        {categoryLabels[service.category]}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg min-h-[1.75rem]">{service.title}</CardTitle>
                    <CardDescription className="mt-2 min-h-[3rem]">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">Características:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {service.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <Shield className="h-3 w-3 mr-2 mt-0.5 text-primary flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-auto pt-4">
                      <Separator className="mb-4" />
                      <div className="space-y-2">
                        <Button 
                          variant="default" 
                          className="w-full"
                          size="lg"
                          asChild
                        >
                          <a href={`/organizations/${slug}/services/request?service=${service.id}`}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Solicitar Ahora
                          </a>
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full"
                          size="sm"
                          asChild
                        >
                          <a href={`/organizations/${slug}/services/${service.id}`}>
                            Más Info
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {/* Main CTA Section */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-4" variant="default">
                OFERTA LIMITADA
              </Badge>
              <CardTitle className="text-2xl">¿Necesitas una solución personalizada?</CardTitle>
              <CardDescription className="text-base mt-2">
                Nuestro equipo de expertos puede diseñar una solución de ciberseguridad 
                adaptada específicamente a las necesidades de tu organización.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Button size="lg" variant="default" asChild>
                  <a href="https://api.whatsapp.com/send?phone=34919049788" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contactar por WhatsApp
                  </a>
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Sin compromiso • Presupuesto personalizado
              </p>
            </CardContent>
          </Card>

          {/* Floating CTA Button */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            <Button 
              size="lg" 
              asChild
            >
              <a href="https://api.whatsapp.com/send?phone=34919049788" target="_blank" rel="noopener noreferrer" className="shadow-lg hover:shadow-xl transition-shadow">
                <MessageCircle className="mr-2 h-5 w-5" />
                ¿Necesitas Ayuda?
              </a>
            </Button>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}