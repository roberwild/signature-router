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
 * 
 * @param getAccessToken - Función para obtener el access token del usuario autenticado
 */
export function createApiClient(getAccessToken?: () => string | null): IApiClient {
  if (config.useMockData) {
    console.log('🎭 Using MOCK API Client');
    return new MockApiClient();
  } else {
    console.log('🌐 Using REAL API Client');
    return new RealApiClient(getAccessToken);
  }
}

/**
 * DEPRECATED: Singleton instance ya no se usa.
 * Usar createApiClient() con el token de sesión en su lugar.
 */
export const apiClient = createApiClient();

/**
 * Hook/función para obtener el cliente API
 * Mantiene compatibilidad con el patrón getApiClient()
 * 
 * @deprecated Use createApiClient() con el token de sesión en su lugar
 */
export function getApiClient(): IApiClient {
  return apiClient;
}

/**
 * Re-exportar tipos para conveniencia
 */
export type * from './types';

