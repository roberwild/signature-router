import 'server-only';

import { auth } from '@workspace/auth';
import { db } from '@workspace/database';
import { userTable, Role } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { NotFoundError } from '@workspace/common/errors';
import type { ProfileDto } from '~/types/dtos/profile-dto';

export async function getAdminProfile(): Promise<ProfileDto> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new NotFoundError('User not authenticated');
  }

  const [userFromDb] = await db
    .select({
      id: userTable.id,
      image: userTable.image,
      name: userTable.name,
      email: userTable.email,
      locale: userTable.locale
    })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (!userFromDb) {
    throw new NotFoundError('User not found');
  }

  return {
    id: userFromDb.id,
    image: userFromDb.image ?? undefined,
    name: userFromDb.name,
    email: userFromDb.email ?? undefined,
    locale: userFromDb.locale,
    isOwner: false, // Admin panel doesn't have organization context
    role: Role.ADMIN // Admin role for display purposes
  };
}