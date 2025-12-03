'use client';

/**
 * React Hook para obtener el API Client con autenticación JWT
 */

import { useSession, signIn } from 'next-auth/react';
import { useMemo, useEffect, useCallback } from 'react';
import { createApiClient } from './client';
import type { IApiClient } from './types';

/**
 * Hook que devuelve el API client con el JWT de la sesión actual
 * 
 * @param options.autoRedirect - Si es true, redirige automáticamente al login cuando la sesión expira
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
export function useApiClientWithStatus(options?: { autoRedirect?: boolean }): { 
  apiClient: IApiClient; 
  isLoading: boolean; 
  isAuthenticated: boolean;
  sessionError: string | undefined;
  redirectToLogin: () => void;
} {
  const { data: session, status } = useSession();
  const autoRedirect = options?.autoRedirect ?? false;

  const apiClient = useMemo(() => {
    return createApiClient(() => {
      // Devolver el accessToken de la sesión, o null si no hay sesión
      return session?.accessToken ?? null;
    });
  }, [session?.accessToken]);

  // Check if token is expired
  const hasValidToken = !!session?.accessToken && session?.error !== "TokenExpired";
  const isAuthenticated = status === 'authenticated' && hasValidToken;
  const isLoading = status === 'loading';

  // Función para redirigir al login
  const redirectToLogin = useCallback(() => {
    signIn('keycloak', { callbackUrl: window.location.pathname });
  }, []);

  // Auto-redirect cuando la sesión expira (solo si autoRedirect está habilitado)
  useEffect(() => {
    if (autoRedirect && !isLoading && !isAuthenticated && status === 'authenticated') {
      // La sesión existe pero el token expiró - redirigir automáticamente
      console.log('[useApiClientWithStatus] Session expired, redirecting to login...');
      redirectToLogin();
    }
  }, [autoRedirect, isLoading, isAuthenticated, status, redirectToLogin]);

  return {
    apiClient,
    isLoading,
    isAuthenticated,
    sessionError: session?.error,
    redirectToLogin,
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

