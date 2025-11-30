import {  NextResponse } from 'next/server';

import { withPlatformAdmin } from '~/lib/security/access-control';
import { applySecurityHeaders } from '~/lib/security/middleware';
import { featureToggleService, EmailFeatureKey } from '~/lib/email/feature-toggle-service';
import { securityAuditLogger, SecurityEventType, getSecurityContextFromRequest } from '~/lib/security/audit-logger';

// Interface for error handling
interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

// GET /api/admin/email-settings/toggles/history - Get toggle change history
export const GET = withPlatformAdmin(async (request, context) => {
  try {
    const url = new URL(request.url);
    const feature = url.searchParams.get('feature') as EmailFeatureKey | null;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
    
    const securityContext = getSecurityContextFromRequest(request, {
      id: context.user.id,
      email: context.user.email
    });

    // Get toggle history
    const history = await featureToggleService.getHistory(feature || undefined, limit);

    // Log access to audit data
    await securityAuditLogger.logEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESSED,
      securityContext,
      {
        resourceType: 'email_feature_toggle_history',
        success: true,
        riskLevel: 'medium',
        details: {
          requestedFeature: feature,
          recordsReturned: history.length,
          limit
        }
      }
    );

    // Format response with additional metadata
    const formattedHistory = history.map(record => ({
      ...record,
      featureDescription: featureToggleService.getFeatureDescription(record.feature as EmailFeatureKey),
      featureCategory: featureToggleService.getFeatureCategory(record.feature as EmailFeatureKey),
      isCriticalFeature: featureToggleService.isCriticalFeature(record.feature as EmailFeatureKey),
      changeType: record.newState ? 'enabled' : 'disabled',
      timeSince: getTimeSinceString(record.changedAt)
    }));

    const response = NextResponse.json({
      success: true,
      history: formattedHistory,
      metadata: {
        totalRecords: history.length,
        requestedFeature: feature,
        limit,
        hasMore: history.length === limit,
        oldestRecord: history.length > 0 ? history[history.length - 1].changedAt : null,
        newestRecord: history.length > 0 ? history[0].changedAt : null
      }
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to get toggle history:', error);
    const typedError = error as EmailError;

    const securityContext = getSecurityContextFromRequest(request, {
      id: context.user.id,
      email: context.user.email
    });

    await securityAuditLogger.logEvent(
      SecurityEventType.ACCESS_DENIED,
      securityContext,
      {
        resourceType: 'email_feature_toggle_history',
        success: false,
        riskLevel: 'medium',
        errorMessage: typedError.message
      }
    );

    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve toggle history',
        message: typedError.message
      },
      { status: 500 }
    );

    return applySecurityHeaders(response);
  }
});

function getTimeSinceString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}