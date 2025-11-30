import {  NextResponse } from 'next/server';
import { z } from 'zod';
import { withPlatformAdmin } from '~/lib/security/access-control';
import { applySecurityHeaders } from '~/lib/security/middleware';
import { featureToggleService, EmailFeatureToggles } from '~/lib/email/feature-toggle-service';
import { securityAuditLogger, SecurityEventType, getSecurityContextFromRequest } from '~/lib/security/audit-logger';

// Interface for error handling
interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

const bulkToggleRequestSchema = z.object({
  enabled: z.boolean(),
  excludeCritical: z.boolean().default(true),
  reason: z.string().optional()
});

// POST /api/admin/email-settings/toggles/bulk - Bulk toggle features
export const POST = withPlatformAdmin(async (request, context) => {
  try {
    const body = await request.json();
    const { enabled, excludeCritical, reason } = bulkToggleRequestSchema.parse(body);
    
    const securityContext = getSecurityContextFromRequest(request, {
      id: context.user.id,
      email: context.user.email
    });

    // Get current state for comparison
    const currentToggles = await featureToggleService.getAllToggles();
    const totalFeatures = Object.keys(currentToggles).length;
    const criticalFeatures = Object.keys(currentToggles).filter(key =>
      featureToggleService.isCriticalFeature(key as keyof EmailFeatureToggles)
    );

    // Perform bulk toggle
    await featureToggleService.bulkToggle(enabled, {
      userId: context.user.id,
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent,
      reason: reason || `Bulk ${enabled ? 'enable' : 'disable'} via API`
    }, excludeCritical);

    // Get final state
    const finalToggles = await featureToggleService.getAllToggles();
    const affectedFeatures = Object.keys(currentToggles).filter(key => {
      if (excludeCritical && featureToggleService.isCriticalFeature(key as keyof EmailFeatureToggles)) {
        return false; // Skip critical features
      }
      const typedKey = key as keyof EmailFeatureToggles;
      return currentToggles[typedKey] !== finalToggles[typedKey];
    });

    // Log the bulk operation
    await securityAuditLogger.logEvent(
      SecurityEventType.EMAIL_CONFIG_UPDATED,
      securityContext,
      {
        resourceType: 'email_feature_toggles_bulk',
        success: true,
        riskLevel: 'high',
        details: {
          operation: `bulk_${enabled ? 'enable' : 'disable'}`,
          totalFeatures,
          affectedFeatures: affectedFeatures.length,
          excludedCritical: excludeCritical,
          criticalFeaturesCount: criticalFeatures.length,
          affectedFeatureList: affectedFeatures,
          reason
        }
      }
    );

    const response = NextResponse.json({
      success: true,
      message: `Bulk ${enabled ? 'enabled' : 'disabled'} ${affectedFeatures.length} features`,
      operation: enabled ? 'enable' : 'disable',
      affectedFeatures: affectedFeatures.length,
      totalFeatures,
      excludedCritical: excludeCritical,
      criticalFeaturesPreserved: excludeCritical ? criticalFeatures.length : 0,
      toggles: finalToggles
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to bulk toggle features:', error);
    const typedError = error as EmailError;

    const securityContext = getSecurityContextFromRequest(request, {
      id: context.user.id,
      email: context.user.email
    });

    // Log the failure
    await securityAuditLogger.logEvent(
      SecurityEventType.EMAIL_CONFIG_UPDATED,
      securityContext,
      {
        resourceType: 'email_feature_toggles_bulk',
        success: false,
        riskLevel: 'critical',
        errorMessage: typedError.message,
        details: { error: typedError.message }
      }
    );

    let response;
    if (error instanceof z.ZodError) {
      response = NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    } else {
      response = NextResponse.json(
        {
          success: false,
          error: 'Failed to bulk toggle features',
          message: typedError.message
        },
        { status: 500 }
      );
    }

    return applySecurityHeaders(response);
  }
});