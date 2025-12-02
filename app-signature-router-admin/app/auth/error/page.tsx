"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: "Error de Configuración",
      description: "Hay un problema con la configuración del servidor. Contacta al administrador.",
    },
    AccessDenied: {
      title: "Acceso Denegado",
      description: "No tienes permisos para acceder a esta aplicación. Contacta al administrador.",
    },
    Verification: {
      title: "Error de Verificación",
      description: "El token de verificación ha expirado o no es válido.",
    },
    OAuthSignin: {
      title: "Error al Iniciar OAuth",
      description: "No se pudo establecer conexión con Keycloak. Verifica que esté ejecutándose.",
    },
    OAuthCallback: {
      title: "Error en Callback OAuth",
      description: "Keycloak no pudo completar la autenticación. Revisa los logs del servidor.",
    },
    OAuthCreateAccount: {
      title: "Error al Crear Cuenta",
      description: "No se pudo crear tu cuenta automáticamente.",
    },
    EmailCreateAccount: {
      title: "Error al Crear Cuenta por Email",
      description: "No se pudo crear la cuenta usando el email proporcionado.",
    },
    Callback: {
      title: "Error en Callback",
      description: "Ocurrió un error al procesar tu autenticación.",
    },
    OAuthAccountNotLinked: {
      title: "Cuenta No Vinculada",
      description: "Esta cuenta ya está vinculada a otro proveedor de identidad.",
    },
    SessionRequired: {
      title: "Sesión Requerida",
      description: "Debes iniciar sesión para acceder a esta página.",
    },
    default: {
      title: "Error de Autenticación",
      description: "Ocurrió un error inesperado durante la autenticación.",
    },
  }

  const errorInfo = errorMessages[error || "default"] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-base">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          {error && (
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                Error Code: <span className="font-semibold text-gray-900 dark:text-gray-100">{error}</span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/auth/signin" className="block">
              <Button className="w-full" size="lg">
                Volver a Intentar
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Ir a Inicio
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
            <p>¿Necesitas ayuda?</p>
            <p className="mt-1">Contacta al equipo de soporte técnico</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

