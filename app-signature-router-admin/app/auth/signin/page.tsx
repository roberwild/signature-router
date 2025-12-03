"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/admin"
  const error = searchParams.get("error")
  const [isLoading, setIsLoading] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignIn = async () => {
    setIsLoading(true)
    console.log("🔐 Iniciando sign in con Keycloak...")
    try {
      const result = await signIn("keycloak", {
        callbackUrl,
        redirect: true,
      })
      console.log("✅ Sign in result:", result)
    } catch (error) {
      console.error("❌ Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-4">
            <Image
              src={mounted && resolvedTheme === 'dark' ? '/singular-bank-logo.svg' : '/singular-bank-logo-black.png'}
              alt="Singular Bank"
              width={200}
              height={60}
              style={{ width: 200, height: 60 }}
              priority
              unoptimized
            />
          </div>
          <CardTitle className="text-3xl font-semibold">
            Signature Router Admin
          </CardTitle>
          <CardDescription className="text-base">
            Accede al panel de administración con tu cuenta corporativa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error === "OAuthAccountNotLinked" && "Esta cuenta ya está vinculada a otro proveedor."}
              {error === "OAuthCallback" && "Error al autenticar con Keycloak. Verifica la configuración."}
              {error === "AccessDenied" && "Acceso denegado. Contacta al administrador."}
              {!["OAuthAccountNotLinked", "OAuthCallback", "AccessDenied"].includes(error) && 
                `Error de autenticación: ${error}`}
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Conectando con Keycloak...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Iniciar Sesión con Keycloak</span>
              </div>
            )}
          </Button>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Autenticación segura mediante OAuth 2.0</p>
            <p className="mt-1">Usa tus credenciales corporativas de Singular Bank</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}

