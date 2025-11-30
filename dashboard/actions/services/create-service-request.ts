'use server';

import { z } from 'zod';
import { db } from '@workspace/database';
import { serviceRequestTable, ServiceRequestStatus, platformEmailSettingsTable, organizationTable } from '@workspace/database/schema';

type ServiceRequest = typeof serviceRequestTable.$inferSelect;
import { auth } from '@workspace/auth';
import { eq } from 'drizzle-orm';
import { databaseEmailService } from '~/lib/email/database-email-service';
import { createServiceRequestNotificationEmail, createServiceRequestStatusUpdateEmail } from '~/lib/email/templates/service-request-template';

// Schema for service request creation
const createServiceRequestSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  serviceType: z.string().max(50),
  serviceName: z.string().max(255),
  contactName: z.string().min(1).max(255),
  contactEmail: z.string().email().max(255),
  contactPhone: z.string().max(50).optional(),
  message: z.string().optional(),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;

export async function createServiceRequest(data: CreateServiceRequestInput) {
  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado'
      };
    }

    // Validate input
    const validatedData = createServiceRequestSchema.parse(data);

    // Create service request in database
    const [serviceRequest] = await db
      .insert(serviceRequestTable)
      .values({
        organizationId: validatedData.organizationId,
        userId: validatedData.userId,
        serviceType: validatedData.serviceType || null,
        serviceName: validatedData.serviceName,
        status: ServiceRequestStatus.PENDING,
        message: validatedData.message || null,
        adminNotes: null,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone || null,
      })
      .returning();

    // Send email notification (will implement in Story 1.15)
    await sendServiceRequestEmail(serviceRequest);

    return {
      success: true,
      data: serviceRequest
    };
  } catch (error) {
    console.error('Error creating service request:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Datos inválidos',
        validationErrors: error.errors
      };
    }

    return {
      success: false,
      error: 'Error al crear la solicitud de servicio'
    };
  }
}

// Email notification for service requests
async function sendServiceRequestEmail(serviceRequest: ServiceRequest) {
  try {
    // Get email settings from database
    const emailSettings = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    if (!emailSettings || emailSettings.length === 0) {
      console.log('No active email settings found');
      return;
    }

    const settings = emailSettings[0];
    
    // Check if service request emails are enabled
    const features = settings.features as Record<string, unknown>;
    if (!features?.serviceRequestEmails) {
      console.log('Service request emails are disabled');
      return;
    }

    // Get the notification email address
    const notificationSettings = settings.notificationSettings as Record<string, unknown>;
    const notificationEmail = notificationSettings?.serviceRequestNotificationEmail as string;
    
    if (!notificationEmail) {
      console.log('No notification email configured for service requests');
      return;
    }

    // Get organization info for better email context
    let organizationName = null;
    if (serviceRequest.organizationId) {
      const org = await db
        .select({ name: organizationTable.name })
        .from(organizationTable)
        .where(eq(organizationTable.id, serviceRequest.organizationId))
        .limit(1);
      
      if (org && org.length > 0) {
        organizationName = org[0].name;
      }
    }

    // Prepare professional email using templates
    const { html: notificationHtml, text: notificationText } = createServiceRequestNotificationEmail({
      serviceName: serviceRequest.serviceName,
      serviceType: serviceRequest.serviceType,
      organizationName,
      contactName: serviceRequest.contactName,
      contactEmail: serviceRequest.contactEmail,
      contactPhone: serviceRequest.contactPhone,
      description: serviceRequest.message,
      urgency: null, // Can be enhanced later to detect urgency
      budget: null, // Can be added to form later
      timeline: null, // Can be added to form later
      requestId: serviceRequest.id,
      createdAt: new Date(),
      dashboardUrl: `https://platform.mineryguard.com/admin/services/${serviceRequest.id}`
    });
    
    // Send notification email to admin with professional template
    await databaseEmailService.sendEmail({
      recipient: notificationEmail,
      subject: `🎯 Nueva solicitud de servicio: ${serviceRequest.serviceName}`,
      html: notificationHtml,
      text: notificationText
    });
    
    console.log('Service request notification sent to:', notificationEmail);
    
    // Send auto-response to requester with professional template
    const { html: autoResponseHtml, text: autoResponseText } = createServiceRequestStatusUpdateEmail({
      serviceName: serviceRequest.serviceName,
      requestId: serviceRequest.id,
      contactName: serviceRequest.contactName,
      newStatus: 'pending',
      adminMessage: 'Hemos recibido tu solicitud correctamente. Nuestro equipo la está revisando y te contactaremos pronto con los próximos pasos.',
      dashboardUrl: `https://platform.mineryguard.com/track/${serviceRequest.id}`
    });
    
    await databaseEmailService.sendEmail({
      recipient: serviceRequest.contactEmail,
      subject: '✅ Confirmación de solicitud - Minery Platform',
      html: autoResponseHtml,
      text: autoResponseText
    });
    
    console.log('Service request confirmation sent to:', serviceRequest.contactEmail);
  } catch (error) {
    console.error('Error sending service request email:', error);
  }
}