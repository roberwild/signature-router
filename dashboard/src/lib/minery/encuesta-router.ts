import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

// Esquema para validar los tiempos de respuesta
const tiempoRespuestaSchema = z.object({
  inicio: z.number(),
  fin: z.number().nullable(),
  duracion: z.number().nullable(),
});

// Esquema para validar las respuestas
const respuestaSchema = z.object({
  preguntaId: z.number(),
  respuesta: z.string(),
  tiempoRespuesta: tiempoRespuestaSchema.nullable().optional(),
});

// Esquema para validar el consentimiento GDPR
const gdprConsentSchema = z.record(z.boolean());

// Esquema para validar los datos de la encuesta
const _encuestaDataSchema = z.object({
  encuestaId: z.string(),
  selectores: z.array(z.string()),
  respuestas: z.array(respuestaSchema),
  utmParams: z.record(z.string()),
  gdprConsent: gdprConsentSchema,
  tiempoEncuesta: z.object({
    inicio: z.number().nullable(),
    fin: z.number().nullable(),
    duracion: z.number().nullable(),
  }),
  test: z.enum(["a", "b"]).optional(),
  formData: z.object({
    nombre: z.string(),
    email: z.string(),
    telefono: z.string()
  }).optional()
});

// Esquema para iniciar encuesta
const _iniciarEncuestaSchema = z.object({
  slug: z.string().optional(),
});

export type EncuestaData = z.infer<typeof _encuestaDataSchema>;
export type IniciarEncuestaInput = z.infer<typeof _iniciarEncuestaSchema>;

// API configuration - exactly as Miguel has it
const API_ENDPOINT_INIT = process.env.API_ENDPOINT_INIT ?? "https://intranet.mineryreport.com/api/encuesta/iniciar/";
const API_ENDPOINT_SAVE_DATA = process.env.API_ENDPOINT_SAVE_DATA ?? "https://intranet.mineryreport.com/api/encuesta/guardar-parcial/";
const API_ENDPOINT_FINALIZE = process.env.API_ENDPOINT_FINALIZE ?? "https://intranet.mineryreport.com/api/encuesta/finalizar/";
const API_SECRET_KEY = process.env.API_SECRET_KEY ?? "fdea6e19-c868-4b15-ab60-735af3c8482d";

// Encuesta service functions - exactly as Miguel has them
export const encuestaService = {
  // Iniciar una nueva encuesta y obtener un ID único
  iniciarEncuesta: async (input: IniciarEncuestaInput) => {
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
  },

  // Guardar datos parciales de la encuesta
  guardarDatosParciales: async (input: EncuestaData) => {
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
  },

  // Finalizar la encuesta y guardar todos los datos
  finalizarEncuesta: async (input: EncuestaData) => {
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
  },
};