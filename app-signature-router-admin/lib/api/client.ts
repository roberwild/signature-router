/**
 * API Client Factory
 * Crea el cliente API apropiado basado en la configuración
 */

import { config } from '../config';
import type { IApiClient } from './types';
import { MockApiClient } from './mock-client';
import { RealApiClient } from './real-client';

/**
 * Factory function que crea el cliente API apropiado
 * según la configuración de useMockData
 */
export function createApiClient(): IApiClient {
  if (config.useMockData) {
    console.log('🎭 Using MOCK API Client');
    return new MockApiClient();
  } else {
    console.log('🌐 Using REAL API Client');
    return new RealApiClient();
  }
}

/**
 * Singleton instance del API client
 * Se crea una sola vez al importar este módulo
 */
export const apiClient = createApiClient();

/**
 * Hook/función para obtener el cliente API
 * Mantiene compatibilidad con el patrón getApiClient()
 */
export function getApiClient(): IApiClient {
  return apiClient;
}

/**
 * Re-exportar tipos para conveniencia
 */
export type * from './types';

