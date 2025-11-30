/**
 * REST API Client for Minery API
 * EXACT COPY OF MIGUEL'S IMPLEMENTATION
 */

import { v4 as uuidv4 } from 'uuid';

// Esquema para validar los tiempos de respuesta
interface TiempoRespuesta {
  inicio: number;
  fin: number | null;
  duracion: number | null;
}

// Esquema para validar las respuestas
interface Respuesta {
  preguntaId: number;
  respuesta: string;
  tiempoRespuesta?: TiempoRespuesta | null;
}

// Esquema para validar el consentimiento GDPR
type GdprConsent = Record<string, boolean>;

// Esquema para validar los datos de la encuesta
interface EncuestaData {
  encuestaId: string;
  selectores: string[];
  respuestas: Respuesta[];
  utmParams: Record<string, string>;
  gdprConsent: GdprConsent;
  tiempoEncuesta: {
    inicio: number | null;
    fin: number | null;
    duracion: number | null;
  };
  test?: "a" | "b";
  formData?: {
    nombre: string;
    email: string;
    telefono: string;
  };
  organizationId?: string; // Add tenant ID for multi-tenancy
}

// Esquema para iniciar encuesta
interface IniciarEncuestaInput {
  slug?: string;
}

// Environment variables - EXACTLY AS MIGUEL HAS THEM
const API_ENDPOINT_INIT = process.env.API_ENDPOINT_INIT ?? "https://intranet.mineryreport.com/api/encuesta/iniciar/";
const API_ENDPOINT_SAVE_DATA = process.env.API_ENDPOINT_SAVE_DATA ?? "https://intranet.mineryreport.com/api/encuesta/guardar-parcial/";
const API_ENDPOINT_FINALIZE = process.env.API_ENDPOINT_FINALIZE ?? "https://intranet.mineryreport.com/api/encuesta/finalizar/";
const API_SECRET_KEY = process.env.API_SECRET_KEY ?? "fdea6e19-c868-4b15-ab60-735af3c8482d";

export class MineryRestClient {
  // Iniciar una nueva encuesta y obtener un ID único - EXACT COPY OF MIGUEL'S CODE
  async iniciarEncuesta(input: IniciarEncuestaInput) {
    // Generar un ID único para la encuesta usando UUID
    const encuestaId = uuidv4();
    const { slug } = input;

    try {
      // Enviar el ID al backend de Django para inicializar la encuesta
      const apiEndpoint = API_ENDPOINT_INIT;
      
      console.log("Iniciando encuesta con ID:", encuestaId, "y slug:", slug);
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_SECRET_KEY,
        },
        body: JSON.stringify({ encuestaId, slug }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al iniciar encuesta: ${response.statusText}`);
      }
      
      const _data = await response.json() as { encuestaId: string };
      return { encuestaId };
    } catch (error) {
      console.error("Error al iniciar encuesta:", error);
      throw new Error("No se pudo iniciar la encuesta");
    }
  }

  // Guardar datos parciales de la encuesta - EXACT COPY OF MIGUEL'S CODE
  async guardarDatosParciales(input: EncuestaData) {
    try {
      // Enviar los datos al API de Django
      const apiEndpoint = API_ENDPOINT_SAVE_DATA;
      
      console.log("Guardando datos parciales:");
      console.log(JSON.stringify(input, null, 2));
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_SECRET_KEY,
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error(`Error al guardar datos: ${response.statusText}`);
      }
      
      const data = await response.json() as { success: boolean };
      return data;
    } catch (error) {
      console.error("Error al guardar datos parciales:", error);
      throw new Error("No se pudieron guardar los datos parciales");
    }
  }

  // Finalizar la encuesta y guardar todos los datos - EXACT COPY OF MIGUEL'S CODE
  async finalizarEncuesta(input: EncuestaData) {
    try {
      // Enviar los datos finales al API de Django
      const apiEndpoint = API_ENDPOINT_FINALIZE;
      
      console.log("Finalizando encuesta:");
      console.log(JSON.stringify(input, null, 2));
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": API_SECRET_KEY,
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error(`Error al finalizar encuesta: ${response.statusText}`);
      }
      
      const data = await response.json() as { success: boolean };
      return data;
    } catch (error) {
      console.error("Error al finalizar encuesta:", error);
      throw new Error("No se pudo finalizar la encuesta");
    }
  }
}

// Export singleton instance
export const mineryRestClient = new MineryRestClient();

// Export types for use in other files
export type { EncuestaData, IniciarEncuestaInput, Respuesta, TiempoRespuesta, GdprConsent };