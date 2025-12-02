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
 * @returns API client configurado con el token de autenticación
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const apiClient = useApiClient();
 *   
 *   useEffect(() => {
 *     apiClient.getSignatureRequests().then(setData);
 *   }, []);
 * }
 * ```
 */
export function useApiClient(): IApiClient {
  const { data: session } = useSession();

  return useMemo(() => {
    return createApiClient(() => {
      // Devolver el accessToken de la sesión, o null si no hay sesión
      return session?.accessToken ?? null;
    });
  }, [session?.accessToken]);
}

