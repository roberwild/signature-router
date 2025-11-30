import { baseEmailTemplate, createInfoBox, createAlertBox, createBadge } from './base-template';

interface ContactFormEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  organizationName?: string;
  messageId: string;
  createdAt: Date;
  dashboardUrl: string;
}

export function createContactFormNotificationEmail(data: ContactFormEmailData): {
  html: string;
  text: string;
} {
  // Format date
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(data.createdAt);

  // Determine message priority based on keywords
  const urgentKeywords = ['urgente', 'urgent', 'inmediato', 'emergency', 'critical', 'ayuda'];
  const isUrgent = urgentKeywords.some(keyword => 
    data.subject.toLowerCase().includes(keyword) || 
    data.message.toLowerCase().includes(keyword)
  );

  const mainContent = `
    <h2 style="margin: 0 0 24px 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
      Nuevo Mensaje de Contacto
    </h2>
    
    ${isUrgent ? createAlertBox(
      `<strong>⚠️ Posible mensaje urgente detectado</strong><br>
      Este mensaje puede requerir atención inmediata basado en su contenido.`,
      'warning'
    ) : ''}
    
    <!-- Message Header Card -->
    <div style="background: linear-gradient(135deg, #1a1a1a, #0f0f0f); border: 1px solid transparent; background-clip: padding-box; position: relative; padding: 24px; border-radius: 12px; margin: 24px 0; overflow: hidden;">
      <div style="position: absolute; inset: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); opacity: 0.1; pointer-events: none;"></div>
      <div style="position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff; line-height: 1.4; flex: 1; margin-right: 12px;">
            ${data.subject}
          </h3>
          ${isUrgent ? createBadge('URGENTE', 'warning') : ''}
        </div>
        <div style="color: #9ca3af; font-size: 13px;">
          <p style="margin: 4px 0;">
            <strong style="color: #e5e7eb;">De:</strong> ${data.name} ${data.organizationName ? `(${data.organizationName})` : ''}
          </p>
          <p style="margin: 4px 0;">
            <strong style="color: #e5e7eb;">Fecha:</strong> ${formattedDate}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Contact Information -->
    ${createInfoBox(
      '👤 Información del Remitente',
      `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 10px 0;">
              <div style="display: flex; align-items: center;">
                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 600; margin-right: 15px;">
                  ${data.name.charAt(0).toUpperCase()}
                </div>
                <div style="display: inline-block; vertical-align: middle;">
                  <strong style="color: #212529; font-size: 16px; display: block;">${data.name}</strong>
                  ${data.organizationName ? `<span style="color: #6c757d; font-size: 14px;">${data.organizationName}</span>` : ''}
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #e9ecef;">
              <strong style="color: #6c757d;">✉️ Email:</strong>
              <a href="mailto:${data.email}" style="color: #667eea; text-decoration: none; margin-left: 10px;">
                ${data.email}
              </a>
            </td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #e9ecef;">
              <strong style="color: #6c757d;">📱 Teléfono:</strong>
              <a href="tel:${data.phone}" style="color: #667eea; text-decoration: none; margin-left: 10px;">
                ${data.phone}
              </a>
            </td>
          </tr>
          ` : ''}
        </table>
      `
    )}
    
    <!-- Message Content -->
    <div style="background-color: #1a1a1a; border: 1px solid #262626; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: -0.025em;">
        💬 Mensaje
      </h3>
      <div style="color: #e5e7eb; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">
        ${data.message}
      </div>
    </div>
    
    <!-- Quick Response Options -->
    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #93bbfc; font-size: 15px; font-weight: 600; letter-spacing: -0.025em;">
        ⚡ Opciones de Respuesta Rápida
      </h3>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px;">
        <tr>
          <td style="padding: 6px;">
            <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" 
               style="display: inline-block; padding: 10px 16px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: -0.025em;">
              📧 Responder Email
            </a>
          </td>
          ${data.phone ? `
          <td style="padding: 6px;">
            <a href="https://wa.me/${data.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${data.name}, recibimos tu mensaje sobre "${data.subject}".`)}" 
               style="display: inline-block; padding: 10px 16px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: -0.025em;">
              💬 WhatsApp
            </a>
          </td>
          ` : ''}
        </tr>
      </table>
    </div>
    
    <!-- Statistics -->
    <div style="background-color: #0f0f0f; border: 1px solid #262626; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; font-family: monospace;">
        <strong style="color: #9ca3af;">ID:</strong> #${data.messageId.slice(0, 8).toUpperCase()} | 
        <strong style="color: #9ca3af;">Recibido:</strong> ${formattedDate}
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    title: 'Nuevo Mensaje de Contacto - Minery Platform',
    preheader: `${data.name} te ha enviado un mensaje: ${data.subject}`,
    content: mainContent,
    ctaButton: {
      text: '📊 Ver en Dashboard',
      url: data.dashboardUrl
    },
    footer: 'Este correo fue enviado porque estás configurado para recibir notificaciones de formularios de contacto.'
  });

  const text = `
Nuevo Mensaje de Contacto - Minery Platform

ASUNTO: ${data.subject}
${isUrgent ? '⚠️ POSIBLE MENSAJE URGENTE\n' : ''}

REMITENTE:
- Nombre: ${data.name}
- Email: ${data.email}
${data.phone ? `- Teléfono: ${data.phone}` : ''}
${data.organizationName ? `- Empresa: ${data.organizationName}` : ''}

MENSAJE:
${data.message}

INFORMACIÓN:
- ID: #${data.messageId.slice(0, 8).toUpperCase()}
- Fecha: ${formattedDate}

RESPONDER:
- Email: mailto:${data.email}
${data.phone ? `- WhatsApp: https://wa.me/${data.phone.replace(/\D/g, '')}` : ''}
- Dashboard: ${data.dashboardUrl}

---
Este es un correo automático de Minery Platform
  `.trim();

  return { html, text };
}

// Auto-response template for contact form submissions
export function createContactFormAutoResponseEmail(data: {
  name: string;
  subject: string;
  ticketId: string;
}): { html: string; text: string } {
  const mainContent = `
    <h2 style="margin: 0 0 24px 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
      ¡Gracias por contactarnos!
    </h2>
    
    <p style="color: #e5e7eb; font-size: 15px; line-height: 1.6; margin: 20px 0;">
      Hola ${data.name},
    </p>
    
    <p style="color: #e5e7eb; font-size: 15px; line-height: 1.6; margin: 20px 0;">
      Hemos recibido tu mensaje sobre <strong style="color: #93bbfc;">"${data.subject}"</strong> y queremos asegurarte que nuestro equipo lo revisará a la brevedad posible.
    </p>
    
    ${createInfoBox(
      '🎫 Tu Número de Ticket',
      `
        <div style="text-align: center; padding: 20px 0;">
          <div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-size: 20px; font-weight: 600; letter-spacing: 2px;">
            #${data.ticketId.slice(0, 8).toUpperCase()}
          </div>
          <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">
            Guarda este número para futuras referencias
          </p>
        </div>
      `
    )}
    
    <!-- What Happens Next -->
    <div style="background-color: #1a1a1a; border: 1px solid #262626; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 16px; font-weight: 600; letter-spacing: -0.025em;">
        📋 ¿Qué sucede ahora?
      </h3>
      <div style="margin: 16px 0;">
        <div style="display: flex; align-items: start; margin: 12px 0;">
          <span style="display: inline-block; min-width: 28px; height: 28px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 13px; margin-right: 12px;">1</span>
          <div style="flex: 1;">
            <strong style="color: #ffffff; font-size: 14px;">Revisión Inicial</strong><br>
            <span style="color: #9ca3af; font-size: 13px;">Nuestro equipo revisará tu mensaje en las próximas 24 horas hábiles.</span>
          </div>
        </div>
        <div style="display: flex; align-items: start; margin: 12px 0;">
          <span style="display: inline-block; min-width: 28px; height: 28px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 13px; margin-right: 12px;">2</span>
          <div style="flex: 1;">
            <strong style="color: #ffffff; font-size: 14px;">Análisis y Asignación</strong><br>
            <span style="color: #9ca3af; font-size: 13px;">Tu solicitud será asignada al especialista más adecuado según tus necesidades.</span>
          </div>
        </div>
        <div style="display: flex; align-items: start; margin: 12px 0;">
          <span style="display: inline-block; min-width: 28px; height: 28px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 13px; margin-right: 12px;">3</span>
          <div style="flex: 1;">
            <strong style="color: #ffffff; font-size: 14px;">Respuesta Personalizada</strong><br>
            <span style="color: #9ca3af; font-size: 13px;">Recibirás una respuesta detallada con los próximos pasos a seguir.</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Response Time Expectations -->
    ${createAlertBox(
      `<strong>⏰ Tiempo de Respuesta Estimado</strong><br>
      • Consultas generales: 24-48 horas<br>
      • Solicitudes urgentes: 4-8 horas<br>
      • Consultas técnicas complejas: 48-72 horas`,
      'info'
    )}
    
    <!-- Contact Information -->
    <div style="background-color: #0f0f0f; border: 1px solid #262626; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 14px;">
        ¿Necesitas ayuda inmediata?
      </p>
      <p style="margin: 0; color: #e5e7eb; font-size: 14px;">
        📧 <a href="mailto:soporte@mineryreport.com" style="color: #3b82f6; text-decoration: none;">soporte@mineryreport.com</a><br>
        🌐 <a href="https://mineryreport.com" style="color: #3b82f6; text-decoration: none;">mineryreport.com</a>
      </p>
    </div>
  `;

  const html = baseEmailTemplate({
    title: 'Confirmación de Recepción - Minery Platform',
    preheader: 'Hemos recibido tu mensaje correctamente',
    content: mainContent,
    footer: 'No respondas a este correo automático. Para consultas adicionales, utiliza los canales de contacto indicados arriba.'
  });

  const text = `
Confirmación de Recepción - Minery Platform

Hola ${data.name},

Hemos recibido tu mensaje sobre "${data.subject}".

TU NÚMERO DE TICKET: #${data.ticketId.slice(0, 8).toUpperCase()}
(Guarda este número para futuras referencias)

¿QUÉ SUCEDE AHORA?
1. Revisión Inicial - En las próximas 24 horas hábiles
2. Análisis y Asignación - Al especialista más adecuado
3. Respuesta Personalizada - Con los próximos pasos

TIEMPO DE RESPUESTA ESTIMADO:
• Consultas generales: 24-48 horas
• Solicitudes urgentes: 4-8 horas
• Consultas técnicas: 48-72 horas

¿NECESITAS AYUDA INMEDIATA?
Email: soporte@mineryreport.com
Web: https://mineryreport.com

---
Este es un correo automático. No respondas a este mensaje.
  `.trim();

  return { html, text };
}