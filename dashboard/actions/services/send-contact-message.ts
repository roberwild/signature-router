'use server';

import { z } from 'zod';
import { db } from '@workspace/database';
import { eq, desc } from 'drizzle-orm';
import { contactMessageTable, platformEmailSettingsTable, organizationTable } from '@workspace/database/schema';
import { databaseEmailService } from '~/lib/email/database-email-service';
import { createContactFormNotificationEmail, createContactFormAutoResponseEmail } from '~/lib/email/templates/contact-form-template';

const contactMessageSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1, 'Subject is required').max(255),
  message: z.string().min(1, 'Message is required')
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export async function sendContactMessage(
  organizationId: string,
  input: ContactMessageInput
) {
  try {
    // Validate input
    const validatedData = contactMessageSchema.parse(input);

    // Save message to database
    const [savedMessage] = await db
      .insert(contactMessageTable)
      .values({
        organizationId,
        ...validatedData,
        status: 'unread'
      })
      .returning();

    // Check if email notifications are enabled
    try {
      const [emailSettings] = await db
        .select()
        .from(platformEmailSettingsTable)
        .where(eq(platformEmailSettingsTable.isActive, true))
        .limit(1);

      if (emailSettings && 
          emailSettings.features && 
          (emailSettings.features as Record<string, unknown>).contactFormEmails &&
          emailSettings.notificationSettings &&
          (emailSettings.notificationSettings as Record<string, unknown>).contactFormNotificationEmail) {
        
        const notificationEmail = (emailSettings.notificationSettings as Record<string, unknown>).contactFormNotificationEmail as string;
        
        // Get organization info for better email context
        let organizationName: string | undefined = undefined;
        if (organizationId) {
          const org = await db
            .select({ name: organizationTable.name })
            .from(organizationTable)
            .where(eq(organizationTable.id, organizationId))
            .limit(1);

          if (org && org.length > 0) {
            organizationName = org[0].name;
          }
        }
        
        // Prepare professional notification email using template
        const { html: notificationHtml, text: notificationText } = createContactFormNotificationEmail({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          subject: validatedData.subject,
          message: validatedData.message,
          organizationName,
          messageId: savedMessage.id,
          createdAt: new Date(),
          dashboardUrl: `https://platform.mineryguard.com/admin/messages/${savedMessage.id}`
        });
        
        // Send notification email to admin with professional template
        await databaseEmailService.sendEmail({
          recipient: notificationEmail,
          subject: `✉️ Nuevo mensaje de contacto: ${validatedData.subject}`,
          html: notificationHtml,
          text: notificationText
        });

        // Send auto-response email to sender with professional template
        const { html: autoResponseHtml, text: autoResponseText } = createContactFormAutoResponseEmail({
          name: validatedData.name,
          subject: validatedData.subject,
          ticketId: savedMessage.id
        });
        
        await databaseEmailService.sendEmail({
          recipient: validatedData.email,
          subject: '✅ Hemos recibido tu mensaje - Minery Platform',
          html: autoResponseHtml,
          text: autoResponseText
        });
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
      // Continue even if email fails - message is saved in database
    }

    return { success: true, message: 'Mensaje enviado correctamente' };
  } catch (error) {
    console.error('Error sending contact message:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: 'Por favor, verifica los datos del formulario',
        errors: error.flatten().fieldErrors 
      };
    }
    
    return { 
      success: false, 
      message: 'Error al enviar el mensaje. Por favor, intenta nuevamente.' 
    };
  }
}

export async function getContactMessages(organizationId: string) {
  return await db
    .select()
    .from(contactMessageTable)
    .where(eq(contactMessageTable.organizationId, organizationId))
    .orderBy(desc(contactMessageTable.createdAt));
}

export async function markMessageAsRead(messageId: string) {
  return await db
    .update(contactMessageTable)
    .set({ status: 'read', updatedAt: new Date() })
    .where(eq(contactMessageTable.id, messageId))
    .returning();
}