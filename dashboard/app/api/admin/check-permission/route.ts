import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, type Permission } from '~/lib/admin/permissions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const permission = searchParams.get('permission') as Permission;

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission parameter is required' },
        { status: 400 }
      );
    }

    const hasAccess = await hasPermission(permission);

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Failed to check permission' },
      { status: 500 }
    );
  }
}