import 'server-only';

import { auth } from '@workspace/auth';
import { db, ConfigurationService } from '@workspace/database';
import { isPlatformAdmin } from '~/middleware/admin';

export async function getConfigurations(includeSensitive: boolean = false) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    throw new Error('Forbidden - Admin access required');
  }

  const configService = new ConfigurationService(db);
  const configs = await configService.getAllConfigs(includeSensitive);

  // Ensure configs is an array
  if (!Array.isArray(configs)) {
    console.error('getAllConfigs returned:', configs);
    return {
      configs: [],
      groupedConfigs: {},
      total: 0
    };
  }

  // Group by category
  const groupedConfigs = configs.reduce((acc, config) => {
    if (config && config.category) {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
    }
    return acc;
  }, {} as Record<string, typeof configs>);

  return {
    configs,
    groupedConfigs,
    total: configs.length
  };
}