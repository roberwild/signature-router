import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { getABExperiments } from '~/data/admin/get-ab-experiments';
import { ABTestingService, type ExperimentConfig } from '@workspace/database/src/services/ab-testing.service';
import { auth } from '@workspace/auth';

export async function GET(_request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');
    
    const data = await getABExperiments();
    
    return Response.json(data);
  } catch (error) {
    console.error('AB experiments API error:', error);
    return Response.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');
    
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: 'User session required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, successMetric, trafficSplit, minimumSampleSize } = body;

    // Create basic experiment with control and variant
    const experimentConfig: ExperimentConfig = {
      name,
      description,
      trafficSplit: Number(trafficSplit),
      successMetric,
      minimumSampleSize: minimumSampleSize ? Number(minimumSampleSize) : undefined,
      variants: [
        {
          name: 'Control',
          description: 'Original questionnaire',
          is_control: true,
          traffic_percentage: 100 - Number(trafficSplit),
          configuration: {}, // Default questionnaire config
        },
        {
          name: 'Variant A',
          description: 'Test variation',
          is_control: false,
          traffic_percentage: Number(trafficSplit),
          configuration: {}, // Modified questionnaire config
        }
      ]
    };

    const experimentId = await ABTestingService.createExperiment(
      experimentConfig, 
      session.user.id
    );

    return Response.json({ 
      success: true, 
      experimentId 
    });
  } catch (error) {
    console.error('Create experiment error:', error);
    return Response.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    );
  }
}