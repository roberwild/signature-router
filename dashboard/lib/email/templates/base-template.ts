export interface EmailTemplateProps {
  title: string;
  preheader?: string;
  content: string;
  ctaButton?: {
    text: string;
    url: string;
  };
  footer?: string;
  unsubscribeUrl?: string;
}

export function baseEmailTemplate({
  title,
  preheader,
  content,
  ctaButton,
  footer,
  unsubscribeUrl
}: EmailTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    /* Remove default styling */
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100%; }
    
    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      .mobile-responsive { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; line-height: 1.6;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>` : ''}
  
  <!-- Main Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Content Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="mobile-responsive" style="background-color: #111111; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to bottom, #111111, #0a0a0a); padding: 32px 30px; text-align: center; border-bottom: 1px solid #1f1f1f;">
              <!-- Logo -->
              <div style="margin: 0 0 16px 0;">
                <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; position: relative;">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 24px; font-weight: bold;">M</div>
                </div>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">
                Minery Platform
              </h1>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px; font-weight: 400;">
                Sistema Inteligente de Ciberseguridad
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 24px; background-color: #111111;" class="mobile-padding">
              ${content}
              
              ${ctaButton ? `
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaButton.url}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: -0.025em; box-shadow: 0 0 24px rgba(59, 130, 246, 0.5); transition: all 0.3s ease;">
                      ${ctaButton.text}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 24px; border-top: 1px solid #1f1f1f;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                      ${footer || 'Este es un correo automático del sistema Minery Platform.'}
                    </p>
                    
                    ${unsubscribeUrl ? `
                    <p style="margin: 12px 0 0 0;">
                      <a href="${unsubscribeUrl}" style="color: #4b5563; font-size: 12px; text-decoration: underline;">
                        Cancelar suscripción
                      </a>
                    </p>
                    ` : ''}
                    
                    <!-- Links -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px auto 0;">
                      <tr>
                        <td style="padding: 0 12px;">
                          <a href="https://mineryreport.com" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 500;">
                            mineryreport.com
                          </a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="mailto:soporte@mineryreport.com" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 500;">
                            soporte@mineryreport.com
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 16px 0 0 0; color: #4b5563; font-size: 11px;">
                      © ${new Date().getFullYear()} Minery Platform · Todos los derechos reservados
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Helper function for creating info boxes
export function createInfoBox(title: string, content: string, icon?: string): string {
  return `
    <div style="background-color: #1a1a1a; border: 1px solid #262626; border-radius: 12px; padding: 20px; margin: 24px 0;">
      ${icon ? `<div style="font-size: 24px; margin-bottom: 12px; filter: grayscale(0%);">${icon}</div>` : ''}
      <h3 style="margin: 0 0 12px 0; color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: -0.025em;">${title}</h3>
      <div style="color: #9ca3af; font-size: 14px; line-height: 1.7;">${content}</div>
    </div>
  `;
}

// Helper function for creating alert boxes
export function createAlertBox(content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
  const colors = {
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#93bbfc', icon: 'ℹ️' },
    success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#86efac', icon: '✅' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#fcd34d', icon: '⚠️' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#fca5a5', icon: '❌' }
  };
  
  const color = colors[type];
  
  return `
    <div style="background-color: ${color.bg}; border: 1px solid ${color.border}; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: ${color.text}; font-size: 14px; line-height: 1.6;">
        <span style="margin-right: 8px;">${color.icon}</span>
        ${content}
      </p>
    </div>
  `;
}

// Helper function for creating data tables
export function createDataTable(rows: Array<{ label: string; value: string }>): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      ${rows.map(row => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #1f1f1f; color: #6b7280; font-size: 14px; width: 40%;">
            <strong>${row.label}:</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #1f1f1f; color: #e5e7eb; font-size: 14px;">
            ${row.value}
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}

// Helper function for creating badges
export function createBadge(text: string, color: 'primary' | 'success' | 'warning' | 'danger' = 'primary'): string {
  const colors = {
    primary: { bg: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', text: '#ffffff' },
    success: { bg: 'linear-gradient(135deg, #22c55e, #16a34a)', text: '#ffffff' },
    warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', text: '#ffffff' },
    danger: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', text: '#ffffff' }
  };
  
  const style = colors[color];
  
  return `<span style="display: inline-block; padding: 4px 12px; background: ${style.bg}; color: ${style.text}; border-radius: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">${text}</span>`;
}