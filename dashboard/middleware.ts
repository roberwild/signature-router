import { NextResponse, type NextRequest } from 'next/server';
import {  defaultLocale, isValidLocale } from '@/lib/i18n';

// This middleware handles both:
// 1. Locale detection and routing for i18n
// 2. Organization slug passing to headers
// 3. Database error handling for service unavailability

const MAX_SLUG_LENGTH = 255;

function getLocaleFromPathname(pathname: string) {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (isValidLocale(potentialLocale)) {
    return {
      locale: potentialLocale,
      pathnameWithoutLocale: '/' + segments.slice(2).join('/'),
    };
  }
  
  return {
    locale: null,
    pathnameWithoutLocale: pathname,
  };
}

function detectLocaleFromRequest(request: NextRequest): string {
  // Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }
  
  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const detectedLocale = acceptLanguage
      .split(',')
      .map(lang => lang.split('-')[0].trim())
      .find(lang => isValidLocale(lang));
    
    if (detectedLocale) {
      return detectedLocale;
    }
  }
  
  return defaultLocale;
}

export function middleware(request: NextRequest): NextResponse<unknown> {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and service-unavailable page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/service-unavailable') ||
    pathname.includes('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js)$/i)
  ) {
    return NextResponse.next();
  }
  
  const { locale: currentLocale, pathnameWithoutLocale } = getLocaleFromPathname(pathname);
  
  let response: NextResponse<unknown>;
  
  // If no locale in path, detect and rewrite
  if (!currentLocale) {
    const detectedLocale = detectLocaleFromRequest(request);
    const localizedPath = `/${detectedLocale}${pathname}`;
    
    response = NextResponse.rewrite(new URL(localizedPath, request.url));
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    });
  } else {
    // Locale is in path, continue
    response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', currentLocale, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    });
  }
  
  // Handle organization slug (now considering locale prefix)
  const pathToCheck = currentLocale ? pathnameWithoutLocale : pathname;
  const pathSegments = pathToCheck.split('/').filter((segment) => segment !== '');
  
  // Check for the specific pattern: /organizations/slug (after locale)
  let slug = null;
  if (pathSegments.length >= 2 && pathSegments[0] === 'organizations') {
    slug = pathSegments[1];
  }
  
  if (slug && slug.length <= MAX_SLUG_LENGTH) {
    response.headers.set('x-organization-slug', slug);
    response.cookies.set('organizationSlug', slug, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)']
};
