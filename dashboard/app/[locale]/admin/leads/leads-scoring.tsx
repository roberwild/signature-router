'use client';

import { Suspense } from 'react';
import { LeadScoringDashboard } from '../lead-scoring/lead-scoring-dashboard';
import type { LeadScoringData } from '~/data/admin/get-lead-scoring';

interface LeadsScoringProps {
  scoringData: LeadScoringData;
}

export function LeadsScoring({ scoringData }: LeadsScoringProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          AI-Powered Lead Scoring
        </h2>
        <p className="text-muted-foreground mt-2">
          Machine learning assessment for lead quality and prioritization
        </p>
      </div>

      <Suspense fallback={<div>Loading lead scores...</div>}>
        <LeadScoringDashboard initialData={scoringData} />
      </Suspense>
    </div>
  );
}