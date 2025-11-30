import { baseEmailTemplate, createInfoBox,  createBadge, createAlertBox } from './base-template';

interface ServiceRequestEmailData {
  serviceName: string;
  serviceType: string | null;
  organizationName: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  description: string | null;
  urgency: string | null;
  budget: string | null;
  timeline: string | null;
  requestId: string;
  createdAt: Date;
  dashboardUrl: string;
}

export function createServiceRequestNotificationEmail(data: ServiceRequestEmailData): {
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

  // Create urgency badge
  const urgencyBadge = data.urgency ? 
    (data.urgency === 'urgent' ? createBadge('URGENTE', 'danger') :
     data.urgency === 'high' ? createBadge('ALTA PRIORIDAD', 'warning') :
     data.urgency === 'medium' ? createBadge('MEDIA', 'primary') :
     createBadge('BAJA', 'success')) : '';

  // Create the main content
  const mainContent = `
    <h2 style="margin: 0 0 24px 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
      Nueva Solicitud de Servicio
    </h2>
    
    ${createAlertBox(
      `Nueva solicitud para <strong style="color: #93bbfc;">${data.serviceName}</strong> ${data.organizationName ? `de <strong style="color: #93bbfc;">${data.organizationName}</strong>` : ''}.`,
      'info'
    )}
    
    <!-- Service Header Card -->
    <div style="background: linear-gradient(135deg, #1a1a1a, #0f0f0f); border: 1px solid transparent; background-clip: padding-box; position: relative; padding: 20px; border-radius: 12px; margin: 24px 0; overflow: hidden;">
      <div style="position: absolute; inset: 0; background: linear-gradient(135deg, #3b82f6, #8b5cf6); opacity: 0.1; pointer-events: none;"></div>
      <div style="position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #ffffff; font-weight: 600;">
            ${data.serviceName}
          </h3>
          ${urgencyBadge ? urgencyBadge : ''}
        </div>
        ${data.serviceType ? `<p style="margin: 4px 0; color: #9ca3af; font-size: 13px;">Tipo: ${data.serviceType}</p>` : ''}
        <p style="margin: 4px 0; color: #6b7280; font-size: 12px; font-family: monospace;">ID: #${data.requestId.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
    
    <!-- Contact Information -->
    ${createInfoBox(
      '👤 Información del Contacto',
      `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #495057;">Nombre:</strong> ${data.contactName}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #495057;">Email:</strong> 
              <a href="mailto:${data.contactEmail}" style="color: #667eea; text-decoration: none;">
                ${data.contactEmail}
              </a>
            </td>
          </tr>
          ${data.contactPhone ? `
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #495057;">Teléfono:</strong> 
              <a href="tel:${data.contactPhone}" style="color: #667eea; text-decoration: none;">
                ${data.contactPhone}
              </a>
            </td>
          </tr>
          ` : ''}
          ${data.organizationName ? `
          <tr>
            <td style="padding: 8px 0;">
              <strong style="color: #495057;">Empresa:</strong> ${data.organizationName}
            </td>
          </tr>
          ` : ''}
        </table>
      `
    )}
    
    ${data.description ? `
    <!-- Description -->
    ${createInfoBox(
      '📝 Descripción del Proyecto',
      `<p style="margin: 0; white-space: pre-wrap;">${data.description}</p>`
    )}
    ` : ''}
    
    <!-- Project Details -->
    <div style="background-color: #1a1a1a; border: 1px solid #262626; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: -0.025em;">
        📊 Detalles del Proyecto
      </h3>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${data.urgency ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #262626;">
            <strong style="color: #9ca3af;">Urgencia:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #262626; text-align: right; color: #e5e7eb;">
            ${data.urgency === 'urgent' ? '🔴 Urgente' :
              data.urgency === 'high' ? '🟠 Alta' :
              data.urgency === 'medium' ? '🟡 Media' : '🟢 Baja'}
          </td>
        </tr>
        ` : ''}
        ${data.budget ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #262626;">
            <strong style="color: #9ca3af;">Presupuesto:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #262626; text-align: right; color: #e5e7eb;">
            💰 ${data.budget}
          </td>
        </tr>
        ` : ''}
        ${data.timeline ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #262626;">
            <strong style="color: #9ca3af;">Línea de Tiempo:</strong>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #262626; text-align: right; color: #e5e7eb;">
            📅 ${data.timeline}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px 0;">
            <strong style="color: #9ca3af;">Fecha de Solicitud:</strong>
          </td>
          <td style="padding: 10px 0; text-align: right; color: #e5e7eb;">
            🕐 ${formattedDate}
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Quick Actions -->
    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #fcd34d; font-size: 15px; font-weight: 600; letter-spacing: -0.025em;">
        ⚡ Acciones Requeridas
      </h3>
      <p style="margin: 8px 0; color: #fed7aa; font-size: 14px; line-height: 1.6;">
        • Responde al cliente dentro de las próximas 24 horas<br>
        • Revisa los detalles de la solicitud en el dashboard<br>
        • Asigna un responsable del equipo técnico si es necesario
      </p>
    </div>
  `;

  // Generate HTML email
  const html = baseEmailTemplate({
    title: 'Nueva Solicitud de Servicio - Minery Platform',
    preheader: `Nueva solicitud de ${data.serviceName} de ${data.contactName}`,
    content: mainContent,
    ctaButton: {
      text: '📋 Ver en Dashboard',
      url: data.dashboardUrl
    },
    footer: `Has recibido este correo porque estás configurado como administrador de notificaciones en Minery Platform.`
  });

  // Generate plain text version
  const text = `
Nueva Solicitud de Servicio - Minery Platform

SERVICIO: ${data.serviceName}
${data.serviceType ? `TIPO: ${data.serviceType}` : ''}
ID: #${data.requestId.slice(0, 8).toUpperCase()}
${data.urgency ? `URGENCIA: ${data.urgency}` : ''}

INFORMACIÓN DEL CONTACTO:
- Nombre: ${data.contactName}
- Email: ${data.contactEmail}
${data.contactPhone ? `- Teléfono: ${data.contactPhone}` : ''}
${data.organizationName ? `- Empresa: ${data.organizationName}` : ''}

${data.description ? `DESCRIPCIÓN:
${data.description}

` : ''}
DETALLES DEL PROYECTO:
${data.urgency ? `- Urgencia: ${data.urgency}` : ''}
${data.budget ? `- Presupuesto: ${data.budget}` : ''}
${data.timeline ? `- Línea de Tiempo: ${data.timeline}` : ''}
- Fecha de Solicitud: ${formattedDate}

ACCIONES REQUERIDAS:
• Responde al cliente dentro de las próximas 24 horas
• Revisa los detalles en: ${data.dashboardUrl}
• Asigna un responsable si es necesario

---
Este es un correo automático de Minery Platform
  `.trim();

  return { html, text };
}

// Template for service request status updates
export function createServiceRequestStatusUpdateEmail(data: {
  serviceName: string;
  requestId: string;
  contactName: string;
  newStatus: string;
  adminMessage?: string;
  dashboardUrl: string;
}): { html: string; text: string } {
  const statusColors = {
    'pending': { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', text: 'Pendiente', icon: '⏳' },
    'in_progress': { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', text: 'En Progreso', icon: '🔄' },
    'completed': { bg: 'linear-gradient(135deg, #22c55e, #16a34a)', text: 'Completado', icon: '✅' },
    'cancelled': { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', text: 'Cancelado', icon: '❌' }
  };

  const status = statusColors[data.newStatus as keyof typeof statusColors] || statusColors.pending;

  const mainContent = `
    <h2 style="margin: 0 0 24px 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
      Actualización de Estado
    </h2>
    
    <div style="background-color: #1a1a1a; border: 1px solid #262626; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 14px;">
        El estado de tu solicitud ha cambiado a:
      </p>
      <div style="display: inline-block; padding: 12px 24px; background: ${status.bg}; color: white; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: -0.025em;">
        ${status.icon} ${status.text}
      </div>
    </div>
    
    ${createInfoBox(
      '📋 Detalles de la Solicitud',
      `
        <p style="margin: 5px 0;"><strong>Servicio:</strong> ${data.serviceName}</p>
        <p style="margin: 5px 0;"><strong>ID:</strong> #${data.requestId.slice(0, 8).toUpperCase()}</p>
      `
    )}
    
    ${data.adminMessage ? `
    ${createInfoBox(
      '💬 Mensaje del Administrador',
      `<p style="margin: 0; font-style: italic;">"${data.adminMessage}"</p>`
    )}
    ` : ''}
  `;

  const html = baseEmailTemplate({
    title: `Actualización de Estado - ${data.serviceName}`,
    preheader: `Tu solicitud ahora está ${status.text}`,
    content: mainContent,
    ctaButton: {
      text: 'Ver Detalles',
      url: data.dashboardUrl
    }
  });

  const text = `
Actualización de Estado - ${data.serviceName}

Tu solicitud ha cambiado a: ${status.text}

DETALLES:
- Servicio: ${data.serviceName}
- ID: #${data.requestId.slice(0, 8).toUpperCase()}

${data.adminMessage ? `MENSAJE DEL ADMINISTRADOR:
"${data.adminMessage}"

` : ''}
Ver más detalles en: ${data.dashboardUrl}
  `.trim();

  return { html, text };
}