'use client';

/**
 * React Hook para obtener el API Client con autenticación JWT
 */

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { createApiClient } from './client';
import type { IApiClient } from './types';

/**
 * Hook que devuelve el API client con el JWT de la sesión actual
 * 
 * @returns Object con API client, estado de carga, y si está autenticado
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { apiClient, isLoading, isAuthenticated } = useApiClientWithStatus();
 *   
 *   useEffect(() => {
 *     if (isAuthenticated) {
 *       apiClient.getSignatureRequests().then(setData);
 *     }
 *   }, [isAuthenticated]);
 * }
 * ```
 */
export function useApiClientWithStatus(): { 
  apiClient: IApiClient; 
  isLoading: boolean; 
  isAuthenticated: boolean;
} {
  const { data: session, status } = useSession();

  const apiClient = useMemo(() => {
    return createApiClient(() => {
      // Devolver el accessToken de la sesión, o null si no hay sesión
      return session?.accessToken ?? null;
    });
  }, [session?.accessToken]);

  return {
    apiClient,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!session?.accessToken,
  };
}

/**
 * Hook simplificado que devuelve solo el API client
 * NOTA: El cliente puede no tener token si la sesión aún está cargando
 * 
 * @returns API client configurado con el token de autenticación
 */
export function useApiClient(): IApiClient {
  const { apiClient } = useApiClientWithStatus();
  return apiClient;
}

