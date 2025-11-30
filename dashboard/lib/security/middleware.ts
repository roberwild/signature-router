import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';

interface UserWithRole {
  role?: string;
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

export function getSecurityHeaders(): SecurityHeaders {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

interface RateLimitStore {
  attempts: Map<string, number[]>;
  blocked: Map<string, number>;
}

const rateLimitStore: RateLimitStore = {
  attempts: new Map(),
  blocked: new Map(),
};

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
      maxAttempts: config.maxAttempts || 100,
      blockDurationMs: config.blockDurationMs || 60 * 60 * 1000, // 1 hour
    };
  }
  
  private getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return `${ip}-${userAgent}`;
  }
  
  private cleanupOldAttempts(attempts: number[]): number[] {
    const now = Date.now();
    return attempts.filter(time => now - time < this.config.windowMs);
  }
  
  isBlocked(identifier: string): boolean {
    const blockedUntil = rateLimitStore.blocked.get(identifier);
    
    if (!blockedUntil) {
      return false;
    }
    
    if (Date.now() > blockedUntil) {
      rateLimitStore.blocked.delete(identifier);
      return false;
    }
    
    return true;
  }
  
  async check(request: NextRequest): Promise<{ allowed: boolean; remaining: number }> {
    const identifier = this.getClientIdentifier(request);
    
    if (this.isBlocked(identifier)) {
      return { allowed: false, remaining: 0 };
    }
    
    const attempts = rateLimitStore.attempts.get(identifier) || [];
    const validAttempts = this.cleanupOldAttempts(attempts);
    
    if (validAttempts.length >= this.config.maxAttempts) {
      rateLimitStore.blocked.set(identifier, Date.now() + this.config.blockDurationMs);
      return { allowed: false, remaining: 0 };
    }
    
    validAttempts.push(Date.now());
    rateLimitStore.attempts.set(identifier, validAttempts);
    
    return {
      allowed: true,
      remaining: this.config.maxAttempts - validAttempts.length,
    };
  }
}

export interface SessionConfig {
  maxAge: number;
  idleTimeout: number;
  absoluteTimeout: number;
}

export class SessionManager {
  private static sessions: Map<string, {
    createdAt: number;
    lastActivity: number;
    userId: string;
  }> = new Map();
  
  private static config: SessionConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    idleTimeout: 15 * 60 * 1000, // 15 minutes
    absoluteTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  
  static validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }
    
    const now = Date.now();
    const idleTime = now - session.lastActivity;
    const totalTime = now - session.createdAt;
    
    if (idleTime > this.config.idleTimeout) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    if (totalTime > this.config.absoluteTimeout) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    session.lastActivity = now;
    return true;
  }
  
  static createSession(sessionId: string, userId: string): void {
    this.sessions.set(sessionId, {
      createdAt: Date.now(),
      lastActivity: Date.now(),
      userId,
    });
  }
  
  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  
  static cleanupExpiredSessions(): void {
    const now = Date.now();

    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      const idleTime = now - session.lastActivity;
      const totalTime = now - session.createdAt;

      if (idleTime > this.config.idleTimeout || totalTime > this.config.absoluteTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export async function requirePlatformAdmin(_request: NextRequest): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return false;
    }
    
    const userRole = (session.user as UserWithRole).role;
    
    return userRole === 'platform_admin' || userRole === 'admin';
  } catch (error) {
    console.error('Error checking platform admin status:', error);
    return false;
  }
}

export async function requireReAuthentication(
  request: NextRequest,
  maxAge: number = 5 * 60 * 1000 // 5 minutes
): Promise<boolean> {
  const reAuthHeader = request.headers.get('x-reauth-timestamp');
  
  if (!reAuthHeader) {
    return false;
  }
  
  const reAuthTime = parseInt(reAuthHeader, 10);
  
  if (isNaN(reAuthTime)) {
    return false;
  }
  
  const timeSinceReAuth = Date.now() - reAuthTime;
  
  return timeSinceReAuth <= maxAge;
}

export class IPAllowlist {
  private static allowedIPs: Set<string> = new Set(
    process.env.ALLOWED_IPS?.split(',').map(ip => ip.trim()) || []
  );
  
  static isAllowed(request: NextRequest): boolean {
    if (this.allowedIPs.size === 0) {
      return true;
    }
    
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    return this.allowedIPs.has(ip);
  }
  
  static addIP(ip: string): void {
    this.allowedIPs.add(ip);
  }
  
  static removeIP(ip: string): void {
    this.allowedIPs.delete(ip);
  }
  
  static getIPs(): string[] {
    return Array.from(this.allowedIPs);
  }
}

setInterval(() => {
  SessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);