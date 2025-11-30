'use server';

import { createOrUpdateAdminSession, setAdminSessionCookie } from '~/lib/admin/session-manager';
import { headers } from 'next/headers';

export async function setAdminSessionCookieAction() {
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined;
  const userAgent = headersList.get('user-agent') || undefined;
  
  const adminSession = await createOrUpdateAdminSession(ipAddress, userAgent);
  
  if (adminSession?.sessionToken) {
    await setAdminSessionCookie(adminSession.sessionToken, adminSession.expiresAt);
    return { success: true };
  }
  
  return { success: false };
}