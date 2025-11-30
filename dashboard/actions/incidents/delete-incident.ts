'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authOrganizationActionClient } from '~/actions/safe-action';
import { incidentDb } from '~/src/features/incidents/data/incident-db';

const deleteIncidentSchema = z.object({
  incidentId: z.string().uuid('ID de incidente inválido'),
});

export const deleteIncident = authOrganizationActionClient
  .metadata({ actionName: 'deleteIncident' })
  .schema(deleteIncidentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { incidentId } = parsedInput;

    // Check if the incident belongs to the organization
    const incident = await incidentDb.getIncidentById(incidentId);
    
    if (!incident) {
      throw new Error('Incidente no encontrado');
    }

    if (incident.organizationId !== ctx.organization.id) {
      throw new Error('No tienes permisos para eliminar este incidente');
    }

    // Delete the incident (this will cascade and delete all versions)
    await incidentDb.deleteIncident(incidentId, ctx.organization.id);

    // Revalidate the incidents page
    revalidatePath(`/organizations/${ctx.organization.slug}/incidents`);

    return {
      success: true,
      message: 'Incidente eliminado correctamente',
    };
  });