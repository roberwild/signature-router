import { BrandGuidelines } from '@workspace/ui/components/brand-guidelines';
import { Logo } from '@workspace/ui/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';

export default function BrandGuidelinesPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Logo Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Logos de Minery Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h3 className="text-xl font-semibold mb-4">Logos Horizontales</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Amarillo (Principal)</p>
                <Logo variant="horizontal" theme="yellow" />
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-muted-foreground mb-2">Oscuro</p>
                <Logo variant="horizontal" theme="dark" />
              </div>
              <div className="p-4 border rounded-lg bg-gray-900">
                <p className="text-sm text-gray-400 mb-2">Blanco</p>
                <Logo variant="horizontal" theme="white" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4">Logos Verticales</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Amarillo</p>
                <Logo variant="vertical" theme="yellow" />
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-muted-foreground mb-2">Oscuro</p>
                <Logo variant="vertical" theme="dark" />
              </div>
              <div className="p-4 border rounded-lg bg-gray-900">
                <p className="text-sm text-gray-400 mb-2">Blanco</p>
                <Logo variant="vertical" theme="white" />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Gris</p>
                <Logo variant="vertical" theme="gray" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4">Logos Extendidos</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Amarillo</p>
                <Logo variant="extended" theme="yellow" />
              </div>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-muted-foreground mb-2">Oscuro</p>
                <Logo variant="extended" theme="dark" />
              </div>
              <div className="p-4 border rounded-lg bg-gray-900">
                <p className="text-sm text-gray-400 mb-2">Blanco</p>
                <Logo variant="extended" theme="white" />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Gris</p>
                <Logo variant="extended" theme="gray" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4">Componente Logo (Solo Símbolo o Texto)</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Solo Símbolo</p>
                <Logo hideWordmark />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Solo Texto</p>
                <Logo hideSymbol />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Completo (Fallback)</p>
                <Logo />
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      {/* Original Brand Guidelines */}
      <BrandGuidelines />
    </div>
  );
}