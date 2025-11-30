import { db } from '@workspace/database';
import { adminSessionTable } from '@workspace/database/schema';
import { auth } from '@workspace/auth';
import { eq, and, gt, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const SESSION_COOKIE_NAME = 'admin-session';

/**
 * Create or update admin session (without setting cookies)
 */
export async function createOrUpdateAdminSession(
  ipAddress?: string,
  userAgent?: string
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const cookieStore = await cookies();
  let sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    // Try to update existing session
    const [existingSession] = await db
      .select()
      .from(adminSessionTable)
      .where(
        and(
          eq(adminSessionTable.sessionToken, sessionToken),
          eq(adminSessionTable.userId, session.user.id),
          gt(adminSessionTable.expiresAt, new Date())
        )
      )
      .limit(1);

    if (existingSession) {
      // Update last activity
      await db
        .update(adminSessionTable)
        .set({
          lastActivity: new Date(),
          expiresAt: new Date(Date.now() + SESSION_TIMEOUT)
        })
        .where(eq(adminSessionTable.id, existingSession.id));

      return existingSession;
    }
  }

  // Create new session
  sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT);

  const [newSession] = await db
    .insert(adminSessionTable)
    .values({
      userId: session.user.id,
      sessionToken,
      lastActivity: new Date(),
      expiresAt,
      ipAddress,
      userAgent
    })
    .returning();

  return newSession;
}

/**
 * Set admin session cookie (for use in Server Actions/Route Handlers)
 */
export async function setAdminSessionCookie(sessionToken: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/admin'
  });
}

/**
 * Check if admin session is valid
 */
export async function validateAdminSession(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return false;
  }

  const [adminSession] = await db
    .select()
    .from(adminSessionTable)
    .where(
      and(
        eq(adminSessionTable.sessionToken, sessionToken),
        eq(adminSessionTable.userId, session.user.id),
        gt(adminSessionTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!adminSession) {
    return false;
  }

  // Check if session has been inactive for too long
  const lastActivityTime = adminSession.lastActivity.getTime();
  const now = Date.now();
  
  if (now - lastActivityTime > SESSION_TIMEOUT) {
    // Session expired due to inactivity
    await db
      .delete(adminSessionTable)
      .where(eq(adminSessionTable.id, adminSession.id));
    
    return false;
  }

  return true;
}

/**
 * Clear expired admin sessions
 */
export async function cleanupExpiredSessions() {
  await db
    .delete(adminSessionTable)
    .where(lt(adminSessionTable.expiresAt, new Date()));
}