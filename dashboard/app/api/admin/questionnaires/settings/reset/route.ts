import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePermission } from '~/lib/admin/permissions';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { resetSettingsToDefaults } from '~/data/admin/questionnaires/get-global-settings';

export async function POST(_request: NextRequest) {
  try {
    // Check permission
    await requirePermission('settings.write');
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Reset settings to defaults
    const defaultSettings = await resetSettingsToDefaults(session.user.id);

    // Log the action
    await logAdminAction({
      action: 'settings.update',
      resource: 'global_settings',
      metadata: {
        action: 'reset_to_defaults',
        resetSettings: Object.keys(defaultSettings)
      }
    });

    return NextResponse.json({ 
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('Failed to reset settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    );
  }
}