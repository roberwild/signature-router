'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MenuIcon } from 'lucide-react';
import { ThemeSwitcher } from '@workspace/ui/components/theme-switcher';
import { Button } from '@workspace/ui/components/button';

import { Sheet, SheetContent, SheetTrigger } from '@workspace/ui/components/sheet';

interface MarketingLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export function MarketingLayout({ children, locale }: MarketingLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a 
              href="https://mineryreport.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Image 
                src="/minery/minery-logo-extended-yellow.png"
                alt="Minery Logo"
                width={220}
                height={36}
                className="h-8 sm:h-9 w-auto object-contain"
                priority
              />
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-6 mr-6">
              <Link href="#soluciones" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Soluciones
              </Link>
              <Link href="#servicios" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Servicios
              </Link>
              <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                FAQ
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeSwitcher />
              <Link href={`/${locale}/auth/sign-in`}>
                <Button variant="outline" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href={`/${locale}/auth/sign-up`}>
                <Button size="sm">
                  Empezar Gratis
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-6">
                  {/* Theme Toggler in Mobile Menu */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <span className="text-sm font-medium">Tema</span>
                    <ThemeSwitcher />
                  </div>
                  
                  <nav className="flex flex-col gap-4">
                    <Link 
                      href="#soluciones" 
                      className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Soluciones
                    </Link>
                    <Link 
                      href="#servicios" 
                      className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Servicios
                    </Link>
                    <Link 
                      href="#faq" 
                      className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      FAQ
                    </Link>
                  </nav>
                  
                  <div className="border-t pt-4">
                    <div className="flex flex-col gap-3">
                      <Link href={`/${locale}/auth/sign-in`}>
                        <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                          Iniciar Sesión
                        </Button>
                      </Link>
                      <Link href={`/${locale}/auth/sign-up`}>
                        <Button className="w-full" onClick={() => setMobileMenuOpen(false)}>
                          Empezar Gratis
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-8 sm:py-6">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between md:gap-4">
            <div className="text-center md:text-left">
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                © 2025 Minery Report SL.
                <span className="hidden sm:inline"> Todos los derechos reservados.</span>
              </p>
            </div>
            <nav className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <Link 
                href="https://mineryreport.com/aviso-legal/" 
                className="hover:underline hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Aviso Legal
              </Link>
              <span className="hidden sm:inline text-muted-foreground/50">•</span>
              <Link 
                href="https://mineryreport.com/politica-de-privacidad/" 
                className="hover:underline hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hidden sm:inline">Política de </span>Privacidad
              </Link>
              <span className="hidden sm:inline text-muted-foreground/50">•</span>
              <Link 
                href="https://mineryreport.com/politica-de-cookies/" 
                className="hover:underline hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hidden sm:inline">Política de </span>Cookies
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}