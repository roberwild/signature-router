import * as React from 'react';
import Image from 'next/image';

import { BlurFade } from '~/components/fragments/blur-fade';
import { GridSection } from '~/components/fragments/grid-section';

const DATA = [
  { src: 'https://storage.googleapis.com/mr-web/images/MR-CL--01.max-300x300.png', alt: 'Client 1' },
  { src: 'https://storage.googleapis.com/mr-web/images/MR-CL--13.max-300x300.png', alt: 'Client 2' },
  { src: 'https://storage.googleapis.com/mr-web/images/MR-CL--11.max-300x300.png', alt: 'Client 3' },
  { src: 'https://storage.googleapis.com/mr-web/images/MR-CL--02.max-300x300.png', alt: 'Client 4' },
  { src: 'https://storage.googleapis.com/mr-web/images/MR-CL--04.max-300x300.png', alt: 'Client 5' }
];

export function Logos(): React.JSX.Element {
  return (
    <GridSection className="bg-diagonal-lines">
      <div className="flex flex-col items-center justify-between gap-2 bg-background p-4 sm:p-8 sm:flex-row sm:py-4 overflow-hidden">
        <BlurFade className="mb-6 sm:mb-0">
          <div className="max-w-[280px] text-center sm:text-left">
            <p className="text-sm font-semibold text-foreground mb-1">
              +450 empresas confían en nosotros
            </p>
            <p className="text-xs text-muted-foreground">
              Despachos jurídicos, asesorías y empresas tecnológicas
            </p>
          </div>
        </BlurFade>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5 lg:max-w-5xl lg:gap-10">
          {DATA.map((logo, index) => (
            <BlurFade
              key={index}
              delay={0.2 + index * 0.2}
              className="flex items-center justify-center"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={120}
                height={60}
                className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-all duration-300"
              />
            </BlurFade>
          ))}
        </div>
      </div>
    </GridSection>
  );
}
