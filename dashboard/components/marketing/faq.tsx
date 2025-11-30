import * as React from 'react';
import Link from 'next/link';

import { APP_NAME } from '@workspace/common/app';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@workspace/ui/components/accordion';

import { GridSection } from '~/components/fragments/grid-section';

const DATA = [
  {
    question: '¿Qué es el registro de incidentes GDPR y por qué es obligatorio?',
    answer: `Según el RGPD Art. 33, todas las empresas están obligadas a mantener un registro de incidentes de seguridad y notificar a la AEPD en 72 horas. ${APP_NAME} automatiza este proceso generando tokens SHA256 inmutables que sirven como prueba irrefutable del cumplimiento, protegiéndote de multas de hasta 10 millones de euros.`
  },
  {
    question: '¿Cómo funcionan los tokens de verificación SHA256?',
    answer: 'Cada incidente genera automáticamente un token único e inmutable usando el algoritmo SHA256. Este token contiene toda la información del incidente de forma encriptada y puede ser verificado públicamente sin acceso al sistema, proporcionando una prueba indiscutible ante auditorías de la AEPD.'
  },
  {
    question: '¿Qué incluye la evaluación de ciberseguridad?',
    answer:
      'La evaluación analiza tres pilares fundamentales: Personas (concienciación y formación), Procesos (políticas y procedimientos) y Sistemas (infraestructura técnica). Recibirás una puntuación de madurez del 0-100% con recomendaciones específicas y podrás compararte con el promedio del sector.'
  },
  {
    question: '¿Puedo probar la plataforma antes de contratar?',
    answer: 'Sí, ofrecemos una evaluación gratuita inicial para que compruebes el estado de tu ciberseguridad. Podrás ver tu puntuación de madurez, identificar vulnerabilidades críticas y recibir un informe básico. Para funciones avanzadas como el registro ilimitado de incidentes y el portal de verificación, necesitarás una suscripción.'
  },
  {
    question: '¿Qué pasa si mi empleado de IT se marcha?',
    answer:
      'A diferencia de hojas Excel o sistemas locales, toda la información permanece segura en la nube y accesible para la organización. El historial completo de incidentes, versiones y tokens se mantiene intacto. Nuevos empleados pueden acceder inmediatamente a todo el conocimiento acumulado.'
  },
  {
    question: '¿Cómo me ayuda con las auditorías de la AEPD?',
    answer: 'El sistema genera automáticamente toda la documentación requerida por la AEPD: registro temporal con timestamps verificables, categorización de datos afectados, medidas implementadas y notificaciones realizadas. El portal público permite a los auditores verificar la autenticidad de cualquier incidente sin necesidad de acceder a tu sistema.'
  },
  {
    question: '¿Qué servicios adicionales ofrecéis?',
    answer:
      'Además del software, ofrecemos servicios especializados: auditorías de ciberseguridad, formación para empleados, implementación de ISO 27001, pentesting, análisis forense, y consultoría GDPR. Nuestro equipo proviene del Ministerio de Defensa con más de 6 años de experiencia en ciberseguridad crítica.'
  },
  {
    question: '¿Cuánto cuesta y cómo funciona el pago?',
    answer:
      'El registro de incidentes cuesta 3,99€/mes o 39,99€/año (ahorra 17%). Las evaluaciones de ciberseguridad son 19,99€ cada una. Los servicios especializados se cotizan según necesidades. Aceptamos pagos por transferencia bancaria y tarjeta. Emitimos facturas válidas para deducción fiscal.'
  }
];

export function FAQ(): React.JSX.Element {
  return (
    <GridSection id="faq">
      <div className="container px-4 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="text-center lg:text-left">
            <h2 className="mb-2.5 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold">
              Preguntas Frecuentes
            </h2>
            <p className="mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base text-muted-foreground lg:max-w-[75%]">
              ¿No encuentras lo que buscas? {' '}
              <Link
                href="mailto:contacto@mineryreport.com"
                className="font-normal text-inherit underline hover:text-foreground"
              >
                Contacta con nosotros
              </Link>
              , estaremos encantados de ayudarte.
            </p>
          </div>
          <div className="mx-auto flex w-full max-w-xl flex-col mt-6 lg:mt-0">
            <Accordion
              type="single"
              collapsible
            >
              {DATA.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={index.toString()}
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </GridSection>
  );
}
