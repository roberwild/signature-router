import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { getLeadScoringData } from '~/data/admin/get-lead-scoring';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');

    const data = await getLeadScoringData();

    // Apply filters
    let filteredLeads = data.topLeads;
    
    if (category && category !== 'all') {
      filteredLeads = filteredLeads.filter(lead => lead.category === category);
    }

    // Apply sorting
    if (sort === 'activity') {
      filteredLeads.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    } else if (sort === 'risk') {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      filteredLeads.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);
    }

    return Response.json({
      ...data,
      topLeads: filteredLeads,
    });
  } catch (error) {
    console.error('Lead scoring API error:', error);
    return Response.json(
      { error: 'Failed to fetch lead scoring data' },
      { status: 500 }
    );
  }
}