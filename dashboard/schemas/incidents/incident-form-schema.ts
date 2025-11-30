import { z } from 'zod';

// Catálogos de valores permitidos
export const TIPO_INCIDENTE = {
  ACCESO_NO_AUTORIZADO: 'acceso_no_autorizado',
  MALWARE_RANSOMWARE: 'malware_ransomware',
  PHISHING: 'phishing',
  PERDIDA_DISPOSITIVO: 'perdida_dispositivo',
  FUGA_DATOS: 'fuga_datos',
  DISPONIBILIDAD: 'disponibilidad',
  CONFIGURACION_ERRONEA: 'configuracion_erronea',
  OTRO: 'otro',
} as const;

export const CATEGORIA_DATOS = {
  IDENTIFICATIVOS: 'identificativos',
  CONTACTO: 'contacto',
  FINANCIEROS: 'financieros',
  SALUD: 'salud',
  LABORALES: 'laborales',
  CREDENCIALES: 'credenciales',
  BIOMETRICOS: 'biometricos',
  MENORES: 'menores',
  OTRO: 'otro',
} as const;

export const ESTADO_INCIDENTE = {
  ABIERTO: 'abierto',
  INVESTIGACION: 'investigacion',
  CERRADO: 'cerrado',
} as const;

// Schema completo según RGPD Art. 33
export const incidentFormSchema = z.object({
  // 1. Identificación del incidente
  deteccionAt: z.date({
    required_error: 'La fecha de detección es obligatoria',
  }),
  deteccionHora: z.string().optional(), // Hora en formato HH:MM
  deteccionTimezone: z.string().optional(), // Zona horaria (opcional)
  descripcionBreve: z.string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  tipoIncidente: z.enum(
    Object.values(TIPO_INCIDENTE) as [string, ...string[]],
    {
      required_error: 'Debe seleccionar el tipo de incidente',
    }
  ),
  categoriaDatos: z.array(
    z.enum(Object.values(CATEGORIA_DATOS) as [string, ...string[]])
  ).min(1, 'Debe seleccionar al menos una categoría de datos'),
  nAfectadosAprox: z.number()
    .min(0, 'El número debe ser positivo')
    .int('Debe ser un número entero'),
  nRegistrosAprox: z.number()
    .min(0, 'El número debe ser positivo')
    .int('Debe ser un número entero'),

  // 2. Consecuencias y evaluación del riesgo
  consecuencias: z.string()
    .min(50, 'Debe describir las consecuencias (mín. 50 caracteres)')
    .max(2000, 'Las consecuencias no pueden exceder 2000 caracteres'),
  riesgosProbables: z.string()
    .min(30, 'Debe describir los riesgos probables (mín. 30 caracteres)')
    .max(2000, 'Los riesgos no pueden exceder 2000 caracteres')
    .optional(),

  // 3. Medidas adoptadas
  medidasAdoptadas: z.string()
    .min(50, 'Debe describir las medidas adoptadas (mín. 50 caracteres)')
    .max(2000, 'Las medidas no pueden exceder 2000 caracteres'),
  medidasPrevistas: z.string()
    .max(2000, 'Las medidas previstas no pueden exceder 2000 caracteres')
    .optional(),

  // 4. Comunicación a autoridades y afectados
  notificadoAEPD: z.boolean(),
  notificadoAEPDAt: z.date().optional(),
  razonRetraso: z.string()
    .max(500, 'La razón del retraso no puede exceder 500 caracteres')
    .optional(),
  
  // Punto de contacto (DPO u otro) - Art. 33.3(b)
  pocNombre: z.string()
    .min(2, 'El nombre del contacto es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  pocEmail: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  pocTelefono: z.string()
    .min(9, 'Teléfono inválido')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  
  notificadoAfectados: z.boolean(),
  notificadoAfectadosAt: z.date().optional(),

  // 5. Seguimiento y cierre
  resolucionAt: z.date().optional(),
  estado: z.enum(
    Object.values(ESTADO_INCIDENTE) as [string, ...string[]],
    {
      required_error: 'Debe seleccionar el estado del incidente',
    }
  ),

  // 6. Información privada (no se muestra públicamente)
  privadoNotas: z.string()
    .max(5000, 'Las notas privadas no pueden exceder 5000 caracteres')
    .optional(),
}).refine(
  (data) => {
    // Si se notificó a la AEPD, la fecha es obligatoria
    if (data.notificadoAEPD && !data.notificadoAEPDAt) {
      return false;
    }
    return true;
  },
  {
    message: 'La fecha de notificación a la AEPD es obligatoria si se ha notificado',
    path: ['notificadoAEPDAt'],
  }
).refine(
  (data) => {
    // Si se notificó a los afectados, la fecha es obligatoria
    if (data.notificadoAfectados && !data.notificadoAfectadosAt) {
      return false;
    }
    return true;
  },
  {
    message: 'La fecha de notificación a los afectados es obligatoria si se ha notificado',
    path: ['notificadoAfectadosAt'],
  }
).refine(
  (data) => {
    // Si han pasado más de 72 horas, la razón del retraso es obligatoria
    if (data.notificadoAEPD && data.notificadoAEPDAt && data.deteccionAt) {
      const hoursElapsed = (data.notificadoAEPDAt.getTime() - data.deteccionAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 72 && !data.razonRetraso) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Debe proporcionar una razón para el retraso en la notificación (más de 72 horas)',
    path: ['razonRetraso'],
  }
);

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

// Schema para actualización (incluye ID del incidente)
// Since the base schema has refinements, we need to create a new schema
export const updateIncidentSchema = z.object({
  incidentId: z.string().uuid(),
  
  // Duplicate all fields from incidentFormSchema
  deteccionAt: z.date({
    required_error: 'La fecha de detección es obligatoria',
  }),
  descripcionBreve: z.string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  tipoIncidente: z.enum(
    Object.values(TIPO_INCIDENTE) as [string, ...string[]],
    {
      required_error: 'Debe seleccionar el tipo de incidente',
    }
  ),
  categoriaDatos: z.array(
    z.enum(Object.values(CATEGORIA_DATOS) as [string, ...string[]])
  ).min(1, 'Debe seleccionar al menos una categoría de datos'),
  nAfectadosAprox: z.number()
    .min(0, 'El número debe ser positivo')
    .int('Debe ser un número entero'),
  nRegistrosAprox: z.number()
    .min(0, 'El número debe ser positivo')
    .int('Debe ser un número entero'),
  consecuencias: z.string()
    .min(50, 'Debe describir las consecuencias (mín. 50 caracteres)')
    .max(2000, 'Las consecuencias no pueden exceder 2000 caracteres'),
  riesgosProbables: z.string()
    .min(30, 'Debe describir los riesgos probables (mín. 30 caracteres)')
    .max(2000, 'Los riesgos no pueden exceder 2000 caracteres')
    .optional(),
  medidasAdoptadas: z.string()
    .min(50, 'Debe describir las medidas adoptadas (mín. 50 caracteres)')
    .max(2000, 'Las medidas no pueden exceder 2000 caracteres'),
  medidasPrevistas: z.string()
    .max(2000, 'Las medidas previstas no pueden exceder 2000 caracteres')
    .optional(),
  notificadoAEPD: z.boolean(),
  notificadoAEPDAt: z.date().optional(),
  razonRetraso: z.string()
    .max(500, 'La razón del retraso no puede exceder 500 caracteres')
    .optional(),
  pocNombre: z.string()
    .min(2, 'El nombre del contacto es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  pocEmail: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  pocTelefono: z.string()
    .min(9, 'Teléfono inválido')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  notificadoAfectados: z.boolean(),
  notificadoAfectadosAt: z.date().optional(),
  resolucionAt: z.date().optional(),
  estado: z.enum(
    Object.values(ESTADO_INCIDENTE) as [string, ...string[]],
    {
      required_error: 'Debe seleccionar el estado del incidente',
    }
  ),
  privadoNotas: z.string()
    .max(5000, 'Las notas privadas no pueden exceder 5000 caracteres')
    .optional(),
});

export type UpdateIncidentFormValues = z.infer<typeof updateIncidentSchema>;