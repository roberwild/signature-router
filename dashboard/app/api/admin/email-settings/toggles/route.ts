import {  NextResponse } from 'next/server';
import { z } from 'zod';
import { withPlatformAdmin } from '~/lib/security/access-control';
import { applySecurityHeaders } from '~/lib/security/middleware';
import { featureToggleService } from '~/lib/email/feature-toggle-service';
import { securityAuditLogger, SecurityEventType, getSecurityContextFromRequest } from '~/lib/security/audit-logger';

// Interface for error handling
interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

const toggleRequestSchema = z.object({
  feature: z.enum([
    'welcomeEmails',
    'passwordResetEmails', 
    'invitationEmails',
    'feedbackEmails',
    'leadQualificationEmails',
    'organizationNotifications',
    'adminAlerts'
  ]),
  enabled: z.boolean(),
  reason: z.string().optional()
});

// GET /api/admin/email-settings/toggles - Get current toggle states
export const GET = withPlatformAdmin(async (request, context) => {
  try {
    const toggles = await featureToggleService.getAllToggles();
    
    // Log access to sensitive configuration
    const securityContext = getSecurityContextFromRequest(request, {
      id: context.user.id,
      email: context.user.email
    });
    
    await securityAuditLogger.logDataAccessEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESSED,
      securityContext,
      'email-feature-toggles',
      'email_settings',
      'read',
      'medium'
    );

    const response = NextResponse.json({ 
      success: true,
      toggles,
      metadata: {
        totalFeatures: Object.keys(toggles).length,
        enabledFeatures: Object.values(toggles).filter(Boolean).length,
        criticalFeatures: ['passwordResetEmails', 'adminAlerts'],
        timestamp: new Date().toISOString()
      }
    });
    
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to get feature toggles:', error);
    const typedError = error as EmailError;

    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve feature toggles',
        message: typedError.message
      },
      { status: 500 }
    );

    return applySecurityHeaders(response);
  }
});

// POST /api/admin/email-settings/toggles - Toggle a specific feature
export const POST = withPlatformAdmin(async (request, context) => {
  try {
    const body = await request.json();
    const { feature, enabled, reason } = toggleRequestSchema.parse(body);
    
    const securityContext = getSecurityContextFromRequest(request, {
      id: context.user.id,
      email: context.user.email
    });

    // Toggle the feature
    await featureToggleService.toggle(feature, enabled, {
      userId: context.user.id,
      ipAddress: securityContext.ipAddress,
      userAgent: securityContext.userAgent,
      reason: reason || `Manual toggle via API`
    });

    // Log the change
    await securityAuditLogger.logEvent(
      SecurityEventType.EMAIL_CONFIG_UPDATED,
      securityContext,
      {
        resourceId: feature,
        resourceType: 'email_feature_toggle',
        success: true,
        riskLevel: featureToggleService.isCriticalFeature(feature) ? 'high' : 'medium',
        details: {
          feature,
          enabled,
          reason,
          previousState: !enabled,
          isCritical: featureToggleService.isCriticalFeature(feature)
        }
      }
    );

    const response = NextResponse.json({
      success: true,
      message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`,
      feature,
      enabled,
      isCritical: featureToggleService.isCriticalFeature(feature),
      description: featureToggleService.getFeatureDescription(feature),
      category: featureToggleService.getFeatureCategory(feature)
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to toggle feature:', error);
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
        resourceType: 'email_feature_toggle',
        success: false,
        riskLevel: 'high',
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
          error: 'Failed to toggle feature',
          message: typedError.message
        },
        { status: 500 }
      );
    }

    return applySecurityHeaders(response);
  }
});