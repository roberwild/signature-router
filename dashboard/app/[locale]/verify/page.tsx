import { Shield, CheckCircle, Users, FileText, BarChart3, ArrowRight, Zap, Lock, Clock, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { PublicTokenQueryForm } from './public-token-query-form';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';

export default function VerifyIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Shield className="h-16 w-16 text-primary" />
                <Badge className="absolute -bottom-2 -right-2 bg-green-600 text-white border-0">
                  RGPD
                </Badge>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              Verificación de Incidentes
            </h1>
            <p className="text-lg text-muted-foreground">
              Sistema profesional de gestión y verificación de incidentes de ciberseguridad
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Token Form - Main Focus */}
            <div className="lg:col-span-2">
              <PublicTokenQueryForm />
            </div>

            {/* Upselling Sidebar */}
            <div className="space-y-4">
              {/* CTA Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Gestiona tus incidentes profesionalmente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Únete a cientos de empresas que confían en Minery y ECIJA para la gestión profesional de incidentes de ciberseguridad.
                  </p>
                  <div className="space-y-2">
                    <Link href="/auth/sign-up" className="block">
                      <Button className="w-full" size="lg">
                        Comenzar Gratis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/auth/sign-in" className="block">
                      <Button variant="outline" className="w-full">
                        Ya tengo cuenta
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Sin tarjeta de crédito • Prueba gratuita de 14 días
                  </p>
                </CardContent>
              </Card>

              {/* Trust Stats */}
              <div className="space-y-3">
                <Card className="p-3 border-primary/20">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-sm font-bold">Desde 2018</div>
                      <div className="text-xs text-muted-foreground">Líderes en Ciberseguridad</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 border-primary/20">
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-sm font-bold">Partner CIS</div>
                      <div className="text-xs text-muted-foreground">Centro Internet Segura</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-3 border-primary/20">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-sm font-bold">900+ Profesionales</div>
                      <div className="text-xs text-muted-foreground">Red ECIJA</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">
              ¿Por qué elegir Minery Report?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lock className="h-5 w-5 text-primary" />
                    Cumplimiento RGPD
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cumple con todos los requisitos del Art. 33 del RGPD. Notificación a AEPD en 72 horas garantizada.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-primary" />
                    Respuesta Rápida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sistema automatizado de alertas y notificaciones. Gestión de incidentes en tiempo real.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Análisis Completo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Dashboard analítico, reportes automáticos y seguimiento detallado de cada incidente.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benefits List */}
          <Card className="mb-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center text-xl">
                Transforma tu gestión de incidentes hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Registro centralizado</p>
                    <p className="text-xs text-muted-foreground">
                      Todos tus incidentes en un solo lugar
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Notificaciones automáticas</p>
                    <p className="text-xs text-muted-foreground">
                      Alertas a AEPD y afectados
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Historial completo</p>
                    <p className="text-xs text-muted-foreground">
                      Trazabilidad de todas las versiones
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Exportación de informes</p>
                    <p className="text-xs text-muted-foreground">
                      PDF, Excel y más formatos
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link href="https://wa.me/message/C35F4AFPXDNUK1">
                  <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Solicitar Demo Personalizada
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-8 items-center opacity-70">
              <Users className="h-8 w-8" />
              <FileText className="h-8 w-8" />
              <Shield className="h-8 w-8" />
              <BarChart3 className="h-8 w-8" />
            </div>
            <p className="text-xs text-muted-foreground">
              Este sistema cumple con los requisitos del RGPD Art. 33 para la
              verificación de incidentes de seguridad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}