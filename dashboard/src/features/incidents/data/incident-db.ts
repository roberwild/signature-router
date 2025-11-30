/**
 * Database operations for incidents
 */

import { db, eq, desc, and, max, sql } from '@workspace/database/client';
import { incidentTable, incidentVersionTable } from '@workspace/database/schema';
import { createHash } from 'crypto';

export interface CreateIncidentInput {
  organizationId: string;
  userId: string;
  fechaDeteccion?: Date;
  descripcion?: string;
  tipoIncidente?: string;
  categoriasDatos?: string;
  numeroAfectados?: number;
  numeroRegistros?: number;
  consecuencias?: string;
  riesgosProbables?: string;
  medidasAdoptadas?: string;
  medidasPrevistas?: string;
  fechaResolucion?: Date;
  notificadoAEPD?: boolean;
  fechaNotificacionAEPD?: Date;
  razonRetraso?: string;
  notificadoAfectados?: boolean;
  fechaNotificacionAfectados?: Date;
  estado?: string;
  pocNombre?: string;
  pocEmail?: string;
  pocTelefono?: string;
  notasInternas?: string;
}

export interface UpdateIncidentInput extends CreateIncidentInput {
  incidentId: string;
}

export class IncidentDatabase {
  /**
   * Generate a unique token for an incident version
   */
  private generateToken(data: unknown): string {
    const hash = createHash('sha256');
    const salt = Date.now().toString() + Math.random().toString();
    hash.update(JSON.stringify(data) + salt);
    return hash.digest('hex');
  }

  /**
   * Get the next internal ID for an organization's incidents
   */
  private async getNextInternalId(organizationId: string): Promise<number> {
    const result = await db
      .select({ maxId: max(incidentTable.internalId) })
      .from(incidentTable)
      .where(eq(incidentTable.organizationId, organizationId));

    return (result[0]?.maxId || 0) + 1;
  }

  /**
   * Create a new incident with initial version
   */
  async createIncident(input: CreateIncidentInput) {
    return await db.transaction(async (tx) => {
      // Get next internal ID for this organization
      const internalId = await this.getNextInternalId(input.organizationId);

      // Create incident record
      const [incident] = await tx
        .insert(incidentTable)
        .values({
          organizationId: input.organizationId,
          internalId,
        })
        .returning();

      // Generate token for first version
      const token = this.generateToken({
        incidentId: incident.id,
        ...input,
      });

      // Create first version
      const [version] = await tx
        .insert(incidentVersionTable)
        .values({
          incidentId: incident.id,
          token,
          fechaDeteccion: input.fechaDeteccion,
          descripcion: input.descripcion,
          tipoIncidente: input.tipoIncidente,
          categoriasDatos: input.categoriasDatos,
          numeroAfectados: input.numeroAfectados,
          consecuencias: input.consecuencias,
          medidasAdoptadas: input.medidasAdoptadas,
          fechaResolucion: input.fechaResolucion,
          notificadoAEPD: input.notificadoAEPD,
          fechaNotificacionAEPD: input.fechaNotificacionAEPD,
          notificadoAfectados: input.notificadoAfectados,
          fechaNotificacionAfectados: input.fechaNotificacionAfectados,
          notasInternas: input.notasInternas,
          createdBy: input.userId,
          versionNumber: 1,
          isLatest: true,
        })
        .returning();

      return {
        incident,
        version,
        token,
      };
    });
  }

  /**
   * Update an incident (creates a new version)
   */
  async updateIncident(input: UpdateIncidentInput) {
    return await db.transaction(async (tx) => {
      // Get the incident
      const [incident] = await tx
        .select()
        .from(incidentTable)
        .where(eq(incidentTable.id, input.incidentId));

      if (!incident) {
        throw new Error('Incident not found');
      }

      // Get the latest version number
      const [latestVersion] = await tx
        .select({ versionNumber: incidentVersionTable.versionNumber })
        .from(incidentVersionTable)
        .where(eq(incidentVersionTable.incidentId, input.incidentId))
        .orderBy(desc(incidentVersionTable.versionNumber))
        .limit(1);

      const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

      // Mark all previous versions as not latest
      await tx
        .update(incidentVersionTable)
        .set({ isLatest: false })
        .where(eq(incidentVersionTable.incidentId, input.incidentId));

      // Generate new token
      const token = this.generateToken({
        ...input,
        versionNumber: nextVersionNumber,
      });

      // Create new version
      const [version] = await tx
        .insert(incidentVersionTable)
        .values({
          incidentId: input.incidentId,
          token,
          fechaDeteccion: input.fechaDeteccion,
          descripcion: input.descripcion,
          tipoIncidente: input.tipoIncidente,
          categoriasDatos: input.categoriasDatos,
          numeroAfectados: input.numeroAfectados,
          consecuencias: input.consecuencias,
          medidasAdoptadas: input.medidasAdoptadas,
          fechaResolucion: input.fechaResolucion,
          notificadoAEPD: input.notificadoAEPD,
          fechaNotificacionAEPD: input.fechaNotificacionAEPD,
          notificadoAfectados: input.notificadoAfectados,
          fechaNotificacionAfectados: input.fechaNotificacionAfectados,
          notasInternas: input.notasInternas,
          createdBy: input.userId,
          versionNumber: nextVersionNumber,
          isLatest: true,
        })
        .returning();

      // Update incident updated timestamp
      await tx
        .update(incidentTable)
        .set({ updatedAt: new Date() })
        .where(eq(incidentTable.id, input.incidentId));

      return {
        incident,
        version,
        token,
      };
    });
  }

  /**
   * Get all incidents for an organization
   */
  async getOrganizationIncidents(organizationId: string) {
    const incidents = await db
      .select({
        incident: incidentTable,
        latestVersion: incidentVersionTable,
      })
      .from(incidentTable)
      .leftJoin(
        incidentVersionTable,
        and(
          eq(incidentVersionTable.incidentId, incidentTable.id),
          eq(incidentVersionTable.isLatest, true)
        )
      )
      .where(eq(incidentTable.organizationId, organizationId))
      .orderBy(desc(incidentTable.updatedAt));

    // Add version count for each incident
    const incidentsWithVersionCount = await Promise.all(
      incidents.map(async (item) => {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(incidentVersionTable)
          .where(eq(incidentVersionTable.incidentId, item.incident.id));
        
        return {
          ...item,
          versionCount: Number(countResult?.count || 1)
        };
      })
    );
    
    return incidentsWithVersionCount;
  }

  /**
   * Get incident by token (public access)
   */
  async getIncidentByToken(token: string) {
    const [version] = await db
      .select()
      .from(incidentVersionTable)
      .where(eq(incidentVersionTable.token, token));

    if (!version) {
      return null;
    }

    // Get the incident
    const [incident] = await db
      .select()
      .from(incidentTable)
      .where(eq(incidentTable.id, version.incidentId));

    // Get all versions for history
    const versions = await db
      .select()
      .from(incidentVersionTable)
      .where(eq(incidentVersionTable.incidentId, version.incidentId))
      .orderBy(desc(incidentVersionTable.versionNumber));

    return {
      currentVersion: version,
      incident,
      history: versions,
    };
  }

  /**
   * Get incident with all versions
   */
  async getIncidentWithHistory(incidentId: string) {
    const [incident] = await db
      .select()
      .from(incidentTable)
      .where(eq(incidentTable.id, incidentId));

    if (!incident) {
      return null;
    }

    const versions = await db
      .select()
      .from(incidentVersionTable)
      .where(eq(incidentVersionTable.incidentId, incidentId))
      .orderBy(desc(incidentVersionTable.versionNumber));

    return {
      incident,
      versions,
    };
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(incidentId: string) {
    const [incident] = await db
      .select()
      .from(incidentTable)
      .where(eq(incidentTable.id, incidentId));

    return incident || null;
  }

  /**
   * Delete an incident and all its versions
   */
  async deleteIncident(incidentId: string, organizationId?: string) {
    return await db.transaction(async (tx) => {
      // Verify ownership if organizationId is provided
      if (organizationId) {
        const [incident] = await tx
          .select()
          .from(incidentTable)
          .where(
            and(
              eq(incidentTable.id, incidentId),
              eq(incidentTable.organizationId, organizationId)
            )
          );

        if (!incident) {
          throw new Error('Incident not found or access denied');
        }
      }

      // Delete will cascade to versions due to foreign key
      await tx
        .delete(incidentTable)
        .where(eq(incidentTable.id, incidentId));

      return true;
    });
  }

  /**
   * Get incident statistics for an organization
   */
  async getOrganizationIncidentStats(organizationId: string) {
    const incidents = await this.getOrganizationIncidents(organizationId);
    
    const stats = {
      total: incidents.length,
      resolved: 0,
      notifiedAEPD: 0,
      notifiedAffected: 0,
      avgResolutionTime: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    incidents.forEach(({ latestVersion }) => {
      if (latestVersion) {
        if (latestVersion.fechaResolucion) {
          stats.resolved++;
          if (latestVersion.fechaDeteccion) {
            const resolutionTime = 
              new Date(latestVersion.fechaResolucion).getTime() - 
              new Date(latestVersion.fechaDeteccion).getTime();
            totalResolutionTime += resolutionTime;
            resolvedCount++;
          }
        }
        if (latestVersion.notificadoAEPD) {
          stats.notifiedAEPD++;
        }
        if (latestVersion.notificadoAfectados) {
          stats.notifiedAffected++;
        }
      }
    });

    if (resolvedCount > 0) {
      // Average resolution time in days
      stats.avgResolutionTime = Math.round(
        totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24)
      );
    }

    return stats;
  }
}

// Export singleton instance
export const incidentDb = new IncidentDatabase();

// Export specific methods for server actions
export const getIncidentByToken = incidentDb.getIncidentByToken.bind(incidentDb);