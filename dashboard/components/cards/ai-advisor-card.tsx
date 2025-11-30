import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarIcon,
  DollarSignIcon,
  GlobeIcon,
  LineChartIcon,
  MapPinIcon,
  TagsIcon,
  User2Icon
} from 'lucide-react';

import { Badge } from '@workspace/ui/components/badge';
import {
  Card,
  CardContent,
  CardFooter,
  type CardProps
} from '@workspace/ui/components/card';


export function AiAdvisorCard(props: CardProps): React.JSX.Element {
  return (
    <Card {...props}>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center gap-3">
          <Image
            src="/minery/minery-logo-vertical-yellow.png"
            alt="Minery Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <h2 className="text-xl font-semibold">Minery Report</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GlobeIcon className="size-4 text-muted-foreground" />
            <span className="w-20 text-sm text-muted-foreground">Web</span>
            <Link
              href="https://mineryreport.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500"
            >
              mineryreport.com
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <User2Icon className="size-4 text-muted-foreground" />
            <span className="w-20 text-sm text-muted-foreground">Fundadores</span>
            <span className="text-sm">Ex-Ministerio Defensa</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="w-20 text-sm text-muted-foreground">Fundada</span>
            <span className="text-sm">2018</span>
          </div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="size-4 text-muted-foreground" />
            <span className="w-20 text-sm text-muted-foreground">Sector</span>
            <span className="text-sm">Legal Tech & Cyber</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="size-4 text-muted-foreground" />
            <span className="w-20 text-sm text-muted-foreground">Ubicación</span>
            <span className="text-sm">Madrid, España</span>
          </div>
          <div className="flex items-center gap-2">
            <TagsIcon className="size-4 text-muted-foreground" />
            <span className="w-20 text-sm text-muted-foreground">Tags</span>
            <div className="flex gap-1">
              <Badge
                variant="secondary"
                className="whitespace-nowrap pl-2 text-xs"
              >
                Blockchain
              </Badge>
              <Badge
                variant="secondary"
                className="whitespace-nowrap pl-2 text-xs"
              >
                GDPR
              </Badge>
              <Badge
                variant="secondary"
                className="whitespace-nowrap pl-2 text-xs"
              >
                Legal
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSignIcon className="size-4 text-muted-foreground" />
            <span className="w-20 text-sm text-muted-foreground">Servicios</span>
            <span className="text-sm">Soluciones Integrales</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start space-y-4 rounded-b-xl bg-neutral-50 pt-6 dark:bg-neutral-900">
        <h3 className="text-base font-semibold sm:text-lg">Contacto</h3>
        <div className="min-h-10 max-w-md text-sm text-muted-foreground space-y-1">
          <div>📧 contacto@mineryreport.com</div>
          <div>📞 +34 91 904 97 88</div>
          <div className="pt-2">Líderes en sistemas de información personalizados para despachos y asesorías jurídicas.</div>
        </div>
      </CardFooter>
    </Card>
  );
}
