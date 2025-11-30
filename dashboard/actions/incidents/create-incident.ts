'use server';

import { revalidatePath } from 'next/cache';

import { authOrganizationActionClient } from '~/actions/safe-action';
import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { incidentFormSchema } from '~/schemas/incidents/incident-form-schema';

export const createIncident = authOrganizationActionClient
  .metadata({ actionName: 'createIncident' })
  .schema(incidentFormSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Check if organization has active subscription for incidents feature
    // TODO: Implement subscription check
    const hasSubscription = true; // Placeholder

    if (!hasSubscription) {
      throw new Error('La organización no tiene una suscripción activa para el registro de incidentes');
    }

    // Map form fields to database fields
    const result = await incidentDb.createIncident({
      organizationId: ctx.organization.id,
      userId: ctx.session.user.id,
      fechaDeteccion: parsedInput.deteccionAt,
      descripcion: parsedInput.descripcionBreve,
      tipoIncidente: parsedInput.tipoIncidente,
      categoriasDatos: parsedInput.categoriaDatos.join(','),
      numeroAfectados: parsedInput.nAfectadosAprox,
      numeroRegistros: parsedInput.nRegistrosAprox,
      consecuencias: parsedInput.consecuencias,
      medidasAdoptadas: parsedInput.medidasAdoptadas,
      medidasPrevistas: parsedInput.medidasPrevistas,
      riesgosProbables: parsedInput.riesgosProbables,
      notificadoAEPD: parsedInput.notificadoAEPD,
      fechaNotificacionAEPD: parsedInput.notificadoAEPDAt,
      razonRetraso: parsedInput.razonRetraso,
      notificadoAfectados: parsedInput.notificadoAfectados,
      fechaNotificacionAfectados: parsedInput.notificadoAfectadosAt,
      fechaResolucion: parsedInput.resolucionAt,
      estado: parsedInput.estado,
      pocNombre: parsedInput.pocNombre,
      pocEmail: parsedInput.pocEmail,
      pocTelefono: parsedInput.pocTelefono,
      notasInternas: parsedInput.privadoNotas,
    });

    // Revalidate the incidents page
    revalidatePath(`/organizations/${ctx.organization.slug}/incidents`);

    return {
      success: true,
      incident: result.incident,
      version: result.version,
      token: result.token,
    };
  });