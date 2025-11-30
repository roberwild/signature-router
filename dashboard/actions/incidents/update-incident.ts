'use server';

import { revalidatePath } from 'next/cache';

import { authOrganizationActionClient } from '~/actions/safe-action';
import { incidentDb } from '~/src/features/incidents/data/incident-db';
import { updateIncidentSchema } from '~/schemas/incidents/incident-form-schema';

export const updateIncident = authOrganizationActionClient
  .metadata({ actionName: 'updateIncident' })
  .schema(updateIncidentSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Check if organization has active subscription for incidents feature
    // TODO: Implement subscription check
    const hasSubscription = true; // Placeholder

    if (!hasSubscription) {
      throw new Error('La organización no tiene una suscripción activa para el registro de incidentes');
    }

    // TODO: Verify user has access to this incident's organization
    // This would check if the incident belongs to the current organization

    // Map form fields to database fields
    const result = await incidentDb.updateIncident({
      organizationId: ctx.organization.id,
      userId: ctx.session.user.id,
      incidentId: parsedInput.incidentId,
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

    // Revalidate the incidents pages
    revalidatePath(`/organizations/${ctx.organization.slug}/incidents`);
    revalidatePath(`/organizations/${ctx.organization.slug}/incidents/${parsedInput.incidentId}`);

    return {
      success: true,
      incident: result.incident,
      version: result.version,
      token: result.token,
    };
  });