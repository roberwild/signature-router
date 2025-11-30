'use server';

import { revalidatePath } from 'next/cache';
import { incidentDb } from '../data/incident-db';

interface UpdateIncidentData {
  incidentId: string;
  organizationId: string;
  userId: string;
  fechaDeteccion?: Date | null;
  descripcion?: string;
  tipoIncidente?: string;
  categoriasDatos?: string;
  numeroAfectados?: number;
  consecuencias?: string;
  medidasAdoptadas?: string;
  fechaResolucion?: Date | null;
  notificadoAEPD?: boolean;
  fechaNotificacionAEPD?: Date | null;
  notificadoAfectados?: boolean;
  fechaNotificacionAfectados?: Date | null;
  notasInternas?: string;
  [key: string]: unknown;
}

export async function updateIncident(data: UpdateIncidentData) {
  try {
    const result = await incidentDb.updateIncident({
      incidentId: data.incidentId,
      organizationId: data.organizationId,
      userId: data.userId,
      fechaDeteccion: data.fechaDeteccion ?? undefined,
      descripcion: data.descripcion,
      tipoIncidente: data.tipoIncidente,
      categoriasDatos: data.categoriasDatos,
      numeroAfectados: data.numeroAfectados,
      consecuencias: data.consecuencias,
      medidasAdoptadas: data.medidasAdoptadas,
      fechaResolucion: data.fechaResolucion ?? undefined,
      notificadoAEPD: data.notificadoAEPD,
      fechaNotificacionAEPD: data.fechaNotificacionAEPD ?? undefined,
      notificadoAfectados: data.notificadoAfectados,
      fechaNotificacionAfectados: data.fechaNotificacionAfectados ?? undefined,
      notasInternas: data.notasInternas,
    });

    // Revalidate the incidents pages
    revalidatePath(`/organizations/[slug]/incidents`);
    revalidatePath(`/organizations/[slug]/incidents/${data.incidentId}`);
    
    return {
      success: true,
      token: result.token,
      incident: result.incident,
      version: result.version
    };
  } catch (error) {
    console.error('Error updating incident:', error);
    return {
      success: false,
      error: 'Error al actualizar el incidente'
    };
  }
}