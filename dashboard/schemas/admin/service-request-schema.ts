/**
 * Service Request Schema
 * Validation schema for service request forms and API
 */

import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  serviceName: z.string().min(1, 'Nombre del servicio requerido'),
  serviceType: z.string().min(1, 'Tipo de servicio requerido'),
  contactName: z.string().min(2, 'Nombre requerido'),
  contactEmail: z.string().email('Email inválido'),
  contactPhone: z.string().optional(),
  message: z.string().optional(),
});

export const updateServiceRequestSchema = z.object({
  status: z.enum(['pending', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
  estimatedValue: z.number().optional(),
  actualValue: z.number().optional(),
  conversionStage: z.string().optional(),
  lostReason: z.string().optional(),
  adminNotes: z.string().optional(),
  nextFollowUp: z.date().optional(),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>;

