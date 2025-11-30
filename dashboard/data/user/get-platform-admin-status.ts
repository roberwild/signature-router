import 'server-only';

import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

export async function isPlatformAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return false;
    }

    const [user] = await db
      .select({
        isPlatformAdmin: userTable.isPlatformAdmin
      })
      .from(userTable)
      .where(eq(userTable.email, session.user.email))
      .limit(1);

    return user?.isPlatformAdmin ?? false;
  } catch (error) {
    console.error('Error checking platform admin status:', error);
    return false;
  }
}