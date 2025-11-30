/**
 * Create Lead Qualification Server Action
 * Handles lead qualification form submission during onboarding
 */

'use server';

import { auth } from '@workspace/auth';
import { createServerAction } from 'next-safe-action';
import { LEAD_CLASSIFICATION_THRESHOLDS, leadQualificationSchema } from '~/schemas/admin/lead-qualification-schema';

// Lead scoring algorithm
function calculateLeadScore(data: any): { score: number; classification: string; components: any } {
    let score = 0;
    const components = {
        urgency: 0,
        budget: 0,
        fit: 0,
        engagement: 0,
        decision: 0,
    };

    // Urgency scoring (35%)
    if (data.recentIncidents === 'urgent') components.urgency = 35;
    else if (data.recentIncidents === 'resolved') components.urgency = 20;
    else if (data.recentIncidents === 'preventive') components.urgency = 10;

    // Budget scoring based on company size (25%)
    const sizeScores: Record<string, number> = { '200+': 25, '51-200': 20, '11-50': 15, '1-10': 10 };
    components.budget = sizeScores[data.companySize] || 5;

    // Product fit (20%)
    if (data.mainConcern) components.fit = 20;

    // Engagement (10%) - based on optional questions answered
    const optionalCount = Object.keys(data.optionalResponses || {}).length;
    components.engagement = Math.min(10, optionalCount * 2);

    // Decision capability (10%)
    if (data.optionalResponses?.role?.includes('CEO') || data.optionalResponses?.role?.includes('CTO')) {
        components.decision = 10;
    }

    score = Object.values(components).reduce((sum, val) => sum + val, 0);

    // Classify lead
    let classification = 'D1';
    if (score >= LEAD_CLASSIFICATION_THRESHOLDS.A1) classification = 'A1';
    else if (score >= LEAD_CLASSIFICATION_THRESHOLDS.B1) classification = 'B1';
    else if (score >= LEAD_CLASSIFICATION_THRESHOLDS.C1) classification = 'C1';

    return { score, classification, components };
}

export const createLeadQualification = createServerAction({
    schema: leadQualificationSchema,
    async action({ parsedInput }) {
        // Get authenticated user
        const session = await auth();
        if (!session?.user) {
            throw new Error('No autenticado');
        }

        // TODO: Get user's organization
        const organizationId = 'mock-org-id';
        const userId = session.user.id;

        // Calculate lead score
        const { score, classification, components } = calculateLeadScore(parsedInput);

        // TODO: Insert into database
        // await db.insert(leadQualificationTable).values({
        //   organizationId,
        //   userId,
        //   mainConcern: parsedInput.mainConcern,
        //   complianceRequirements: parsedInput.complianceRequirements,
        //   complianceOther: parsedInput.complianceOther,
        //   itTeamSize: parsedInput.itTeamSize,
        //   companySize: parsedInput.companySize,
        //   recentIncidents: parsedInput.recentIncidents,
        //   optionalResponses: parsedInput,
        //   specificNeeds: parsedInput.specificNeeds,
        //   leadScore: score,
        //   leadClassification: classification,
        //   scoreComponents: components,
        // });

        // TODO: Send notification to admin for hot leads (A1)
        // if (classification === 'A1') {
        //   await sendHotLeadNotification(userId, score);
        // }

        return {
            success: true,
            score,
            classification,
        };
    },
});

