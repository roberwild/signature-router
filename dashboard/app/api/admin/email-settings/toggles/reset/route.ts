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

const resetRequestSchema = z.object({
  reason: z.string().optional()
});

// POST /api/admin/email-settings/toggles/reset - Reset all toggles to defaults
export const POST = withPlatformAdmin(async (request, context) => {
  try {
    const body = await request.json();
    const { reason } = resetRequestSchema.parse(body);
    
    const securityContext = getSecurityContextFromRequest(request, {
      id: context.user.id,
      email: context.user.email
    });

    // Get current state for comparison
    const currentToggles = await featureToggleService.getAllToggles();
    const defaultToggles = featureToggleService.getDefaultToggles();
    
    // Calculate what will change
    const changedFeatures = Object.keys(currentToggles).filter(key => {
      const typedKey = key as keyof EmailFeatureToggles;
      return currentToggles[typedKey] !== defaultToggles[typedKey];
    });

    // Reset to defaults
    await featureToggleService.resetToDefaults({
      userId: context.user.id,
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent,
      reason: reason || 'Reset to defaults via API'
    });

    // Get final state
    const finalToggles = await featureToggleService.getAllToggles();

    // Log the reset operation
    await securityAuditLogger.logEvent(
      SecurityEventType.EMAIL_CONFIG_UPDATED,
      securityContext,
      {
        resourceType: 'email_feature_toggles_reset',
        success: true,
        riskLevel: 'high',
        details: {
          operation: 'reset_to_defaults',
          totalFeatures: Object.keys(currentToggles).length,
          changedFeatures: changedFeatures.length,
          changedFeatureList: changedFeatures,
          reason,
          beforeState: currentToggles,
          afterState: finalToggles,
          defaultState: defaultToggles
        }
      }
    );

    const response = NextResponse.json({
      success: true,
      message: `Reset ${changedFeatures.length} features to defaults`,
      operation: 'reset_to_defaults',
      changedFeatures: changedFeatures.length,
      totalFeatures: Object.keys(currentToggles).length,
      changedFeatureList: changedFeatures,
      toggles: finalToggles,
      defaults: defaultToggles
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to reset feature toggles:', error);
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
        resourceType: 'email_feature_toggles_reset',
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
          error: 'Failed to reset feature toggles',
          message: typedError.message
        },
        { status: 500 }
      );
    }

    return applySecurityHeaders(response);
  }
});