/**
 * GraphQL Queries and Mutations for Minery API
 * Based on the existing Minery LeadMagnet implementation
 */

// ============ TYPES ============

export interface EstadisticasRespuestaEncuesta {
  totalRespuestas: number;
  respuestasConDatos: number;
  respuestasFinalizadas: number;
  respuestasCompletadasNoEnviadas: number;
  // Custom fields for our assessment scoring
  scorePersonas?: number;
  scoreProcesos?: number;
  scoreSistemas?: number;
  scoreTotal?: number;
}

export interface DatosGraficoRespuesta {
  periodo: string;
  totalRespuestas: number;
  respuestasConDatos: number;
  respuestasFinalizadas: number;
  respuestasCompletadasNoEnviadas: number;
  // Custom fields for assessment scores over time
  scorePersonas?: number;
  scoreProcesos?: number;
  scoreSistemas?: number;
  scoreTotal?: number;
}

export interface GraficoRespuestasEncuesta {
  tipoAgrupacion: string;
  datos: DatosGraficoRespuesta[];
}

export interface RespuestaEncuesta {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  telefono?: string;
  dataTreatment: boolean;
  marketing: boolean;
  datosCompletos: Record<string, unknown>;
  datosCompletosJson: Record<string, unknown>;
  fechaInicio: string;
  fechaActualizacion: string;
  finalizada: boolean;
  extra?: Record<string, unknown>;
}

// ============ QUERIES ============

/**
 * Query to get survey by slug
 */
export const GET_ENCUESTA_BY_SLUG = `
  query GetEncuestaBySlug($slug: String!) {
    listAllEncuestas(filter: { slug: { exact: $slug } }) {
      edges {
        node {
          id
          slug
          url
          pageTitle
          metaDescription
          withSelectores
        }
      }
    }
  }
`;

/**
 * Query to get assessment response by UID
 */
export const GET_RESPUESTA_ENCUESTA = `
  query GetRespuestaEncuesta($uid: String!) {
    respuestaEncuesta(uid: $uid) {
      id
      uid
      nombre
      email
      telefono
      dataTreatment
      marketing
      datosCompletos
      datosCompletosJson
      fechaInicio
      fechaActualizacion
      finalizada
      extra
    }
  }
`;

/**
 * Query to get all assessment responses (for a specific survey)
 */
export const LIST_ALL_RESPUESTAS_ENCUESTA = `
  query ListAllRespuestasEncuesta(
    $offset: Int
    $before: String
    $after: String
    $first: Int
    $last: Int
    $filter: ExtendedRespuestaEncuestaRespuestaEncuestaFilterFilterInputType
  ) {
    listAllRespuestasEncuesta(
      offset: $offset
      before: $before
      after: $after
      first: $first
      last: $last
      filter: $filter
    ) {
      edges {
        node {
          id
          uid
          nombre
          email
          telefono
          dataTreatment
          marketing
          datosCompletos
          datosCompletosJson
          fechaInicio
          fechaActualizacion
          finalizada
          extra
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

/**
 * Query to get assessment statistics
 */
export const GET_ESTADISTICAS_RESPUESTAS_ENCUESTA = `
  query EstadisticasRespuestasEncuesta(
    $encuestaId: ID!
    $fechaDesde: Date
    $fechaHasta: Date
    $testFilter: String
  ) {
    estadisticasRespuestasEncuesta(
      encuestaId: $encuestaId
      fechaDesde: $fechaDesde
      fechaHasta: $fechaHasta
      testFilter: $testFilter
    ) {
      totalRespuestas
      respuestasConDatos
      respuestasFinalizadas
      respuestasCompletadasNoEnviadas
    }
  }
`;

/**
 * Query to get assessment response graph data
 */
export const GET_GRAFICO_RESPUESTAS_ENCUESTA = `
  query GraficoRespuestasEncuesta(
    $encuestaId: ID!
    $fechaDesde: Date
    $fechaHasta: Date
    $testFilter: String
  ) {
    graficoRespuestasEncuesta(
      encuestaId: $encuestaId
      fechaDesde: $fechaDesde
      fechaHasta: $fechaHasta
      testFilter: $testFilter
    ) {
      tipoAgrupacion
      datos {
        periodo
        totalRespuestas
        respuestasConDatos
        respuestasFinalizadas
        respuestasCompletadasNoEnviadas
      }
    }
  }
`;

// ============ MUTATIONS ============

/**
 * Mutation to create or update assessment response
 * This will be used to submit assessment answers
 * Updated to match Minery API mutation structure
 */
export const CREATE_UPDATE_RESPUESTA_ENCUESTA = `
  mutation CreateUpdateRespuestaEncuesta(
    $encuestaId: ID!
    $uid: String!
    $nombre: String!
    $email: String!
    $telefono: String
    $dataTreatment: Boolean!
    $marketing: Boolean!
    $datosCompletos: String!
    $finalizada: Boolean!
    $extra: String
  ) {
    createUpdateRespuestaEncuesta(
      encuestaId: $encuestaId
      uid: $uid
      nombre: $nombre
      email: $email
      telefono: $telefono
      dataTreatment: $dataTreatment
      marketing: $marketing
      datosCompletos: $datosCompletos
      finalizada: $finalizada
      extra: $extra
    ) {
      respuestaEncuesta {
        id
        uid
        nombre
        email
        telefono
        dataTreatment
        marketing
        datosCompletos
        datosCompletosJson
        fechaInicio
        fechaActualizacion
        finalizada
        extra
      }
      errors
    }
  }
`;

// ============ HELPER FUNCTIONS ============

/**
 * Extract assessment scores from response data
 */
export function extractScoresFromResponse(datosCompletosJson: unknown): {
  personas: number;
  procesos: number;
  sistemas: number;
  total: number;
} {
  // This will need to be implemented based on the actual data structure
  // returned by the Minery API for the cybersecurity assessment
  const scores = {
    personas: 0,
    procesos: 0,
    sistemas: 0,
    total: 0,
  };

  if (datosCompletosJson && typeof datosCompletosJson === 'object') {
    // Parse the assessment data to extract scores
    // The exact implementation depends on how Minery structures the data
    const assessmentData = datosCompletosJson as Record<string, unknown>;
    scores.personas = (assessmentData.scorePersonas as number) || 0;
    scores.procesos = (assessmentData.scoreProcesos as number) || 0;
    scores.sistemas = (assessmentData.scoreSistemas as number) || 0;
    scores.total = (assessmentData.scoreTotal as number) ||
                   Math.round((scores.personas + scores.procesos + scores.sistemas) / 3);
  }

  return scores;
}

/**
 * Format date for GraphQL queries
 */
export function formatDateForGraphQL(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Build filter for assessment responses
 */
export function buildAssessmentFilter(
  organizationEmail: string,
  encuestaId: string = '1' // Default to assessment ID 1
) {
  return {
    encuestaId: {
      exact: encuestaId,
    },
    email: {
      unaccent_Iexact: organizationEmail,
    },
    finalizada: {
      exact: true,
    },
  };
}