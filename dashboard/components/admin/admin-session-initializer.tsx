'use client';

import { useEffect } from 'react';
import { setAdminSessionCookieAction } from '../../actions/admin/set-session-cookie';

export function AdminSessionInitializer() {
  useEffect(() => {
    setAdminSessionCookieAction();
  }, []);

  return null;
}