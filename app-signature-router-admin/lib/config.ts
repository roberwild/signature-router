/**
 * Configuración de la aplicación
 * Feature flags y configuración de entorno
 */

export const config = {
  // Mock Data Toggle
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1',
  apiTimeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
  
  // Mock Configuration
  mockDelay: parseInt(process.env.NEXT_PUBLIC_MOCK_DELAY || '500', 10), // Simular latencia de red
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Debug
  enableDebugLogs: process.env.NEXT_PUBLIC_DEBUG === 'true',
} as const;

/**
 * Log de configuración al iniciar (solo en desarrollo)
 */
if (config.isDevelopment && typeof window !== 'undefined') {
  console.log('🔧 App Configuration:', {
    useMockData: config.useMockData,
    apiBaseUrl: config.apiBaseUrl,
    mockDelay: config.mockDelay,
  });
}

