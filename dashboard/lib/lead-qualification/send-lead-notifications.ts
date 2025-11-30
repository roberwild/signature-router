import { Resend } from 'resend';
import { type LeadDetail } from '~/data/admin/get-lead-by-id';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'contacto@mineryreport.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@mineryreport.com';

export type LeadNotificationType = 'hot_lead' | 'daily_digest' | 'weekly_summary';

interface LeadEmailData {
  lead: LeadDetail;
  type: LeadNotificationType;
}

export async function sendLeadNotification(data: LeadEmailData) {
  const { lead, type } = data;
  
  try {
    switch (type) {
      case 'hot_lead':
        await sendHotLeadNotification(lead);
        break;
      case 'daily_digest':
        // Implement daily digest logic
        break;
      case 'weekly_summary':
        // Implement weekly summary logic
        break;
    }
  } catch (error) {
    console.error('Error sending lead notification:', error);
    throw error;
  }
}

async function sendHotLeadNotification(lead: LeadDetail) {
  const whatsappLink = lead.userPhone 
    ? `https://wa.me/${lead.userPhone.replace(/\D/g, '')}` 
    : null;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
        .badge-hot { background: #dc2626; color: white; }
        .score { font-size: 36px; font-weight: bold; color: #dc2626; }
        .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #6b7280; }
        .cta { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .urgency-notice { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔥 Hot Lead Alert - Immediate Action Required!</h1>
          <p style="margin: 0;">Response required within 2 hours</p>
        </div>
        
        <div class="urgency-notice">
          <strong>⚡ URGENT:</strong> This is an A1 classified lead with score ${lead.leadScore}/100. 
          High conversion probability if contacted immediately.
        </div>
        
        <div class="content">
          <h2>Lead Information</h2>
          
          <div class="info-row">
            <span class="label">Name:</span> ${lead.userName}
          </div>
          
          <div class="info-row">
            <span class="label">Email:</span> ${lead.userEmail}
          </div>
          
          ${lead.userPhone ? `
          <div class="info-row">
            <span class="label">Phone:</span> ${lead.userPhone}
          </div>
          ` : ''}
          
          ${lead.organizationName ? `
          <div class="info-row">
            <span class="label">Company:</span> ${lead.organizationName}
          </div>
          ` : ''}
          
          <div class="info-row">
            <span class="label">Company Size:</span> ${getCompanySizeLabel(lead.companySize)}
          </div>
          
          <h3>Primary Need</h3>
          <div class="info-row">
            <span class="label">Main Concern:</span> ${getMainConcernLabel(lead.mainConcern)}
          </div>
          
          <div class="info-row">
            <span class="label">Recent Incidents:</span> ${getIncidentLabel(lead.recentIncidents)}
          </div>
          
          ${lead.specificNeeds ? `
          <h3>Specific Requirements</h3>
          <div class="info-row" style="background: #fef3c7;">
            ${lead.specificNeeds}
          </div>
          ` : ''}
          
          <h3>Lead Score Breakdown</h3>
          <div style="display: flex; justify-content: space-around; margin: 20px 0;">
            <div style="text-align: center;">
              <div class="score">${lead.leadScore}</div>
              <div>Total Score</div>
            </div>
            ${lead.scoreComponents ? `
            <div style="text-align: left; padding-left: 20px;">
              <div>✓ Urgency: ${lead.scoreComponents.urgency}/35</div>
              <div>✓ Budget: ${lead.scoreComponents.budget}/25</div>
              <div>✓ Product Fit: ${lead.scoreComponents.fit}/20</div>
              <div>✓ Engagement: ${lead.scoreComponents.engagement}/10</div>
              <div>✓ Decision: ${lead.scoreComponents.decision}/10</div>
            </div>
            ` : ''}
          </div>
          
          <h3>Take Action Now</h3>
          <div style="text-align: center; margin: 30px 0;">
            ${whatsappLink ? `
            <a href="${whatsappLink}" class="cta" style="background: #25d366;">
              📱 Contact via WhatsApp
            </a>
            ` : ''}
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${lead.id}" class="cta">
              👁️ View Full Details
            </a>
          </div>
          
          <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <strong>Pro Tips for Conversion:</strong>
            <ul style="margin: 10px 0;">
              <li>Call within 5 minutes for 100x higher contact rate</li>
              <li>Reference their specific concern: "${getMainConcernLabel(lead.mainConcern)}"</li>
              <li>Mention compliance if relevant: ${lead.complianceRequirements?.join(', ') || 'N/A'}</li>
              <li>Be prepared to discuss immediate solutions</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px;">
          <p>This is an automated notification from Minery Guard Lead System</p>
          <p>Lead created: ${new Date(lead.createdAt).toLocaleString('es-ES')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await resend.emails.send({
    from: `Minery Lead System <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `🔥 LEAD CALIENTE: ${lead.userName} - Puntaje ${lead.leadScore}/100 - ACCIÓN INMEDIATA`,
    html: emailHtml,
    tags: [
      { name: 'type', value: 'hot_lead' },
      { name: 'lead_id', value: lead.id },
      { name: 'classification', value: lead.leadClassification },
    ],
  });

  return result;
}

export async function sendDailyLeadDigest(leads: LeadDetail[]) {
  if (leads.length === 0) return;

  const b1Leads = leads.filter(l => l.leadClassification === 'B1');
  const c1Leads = leads.filter(l => l.leadClassification === 'C1');
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .lead-card { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #f59e0b; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Daily Lead Digest</h1>
          <p style="margin: 0;">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div class="content">
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${leads.length}</div>
              <div>Total New Leads</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: #f59e0b;">${b1Leads.length}</div>
              <div>Warm Leads (B1)</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: #6b7280;">${c1Leads.length}</div>
              <div>Cold Leads (C1)</div>
            </div>
          </div>
          
          ${b1Leads.length > 0 ? `
          <h2>🟠 Warm Leads - Contact within 24 hours</h2>
          ${b1Leads.map(lead => `
            <div class="lead-card">
              <strong>${lead.userName}</strong> - ${lead.organizationName || 'No company'}<br>
              Score: ${lead.leadScore}/100 | ${getCompanySizeLabel(lead.companySize)}<br>
              Concern: ${getMainConcernLabel(lead.mainConcern)}<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${lead.id}">View Details →</a>
            </div>
          `).join('')}
          ` : ''}
          
          ${c1Leads.length > 0 ? `
          <h2>🔵 Cold Leads - Contact within 72 hours</h2>
          ${c1Leads.map(lead => `
            <div class="lead-card" style="border-left-color: #6b7280;">
              <strong>${lead.userName}</strong> - ${lead.organizationName || 'No company'}<br>
              Score: ${lead.leadScore}/100 | ${getCompanySizeLabel(lead.companySize)}<br>
              Concern: ${getMainConcernLabel(lead.mainConcern)}<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${lead.id}">View Details →</a>
            </div>
          `).join('')}
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
              View All Leads in Dashboard
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: `Minery Lead System <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `Resumen Diario de Leads: ${leads.length} nuevos leads (${b1Leads.length} calientes)`,
    html: emailHtml,
    tags: [
      { name: 'type', value: 'daily_digest' },
    ],
  });
}

// Helper functions for labels
function getCompanySizeLabel(size: string | null): string {
  const labels: Record<string, string> = {
    '1-10': '1-10 employees',
    '11-50': '11-50 employees',
    '51-200': '51-200 employees',
    '200+': '200+ employees',
  };
  return labels[size || ''] || size || 'Not specified';
}

function getMainConcernLabel(concern: string | null): string {
  const labels: Record<string, string> = {
    security_level: 'Security Assessment',
    vulnerabilities: 'Vulnerability Testing',
    no_team: 'No Security Team',
    incident_response: 'Incident Response',
  };
  return labels[concern || ''] || concern || 'Not specified';
}

function getIncidentLabel(incident: string | null): string {
  const labels: Record<string, string> = {
    'urgent': 'Yes, need urgent help',
    'resolved': 'Yes, but resolved',
    'preventive': 'No, want prevention',
    'unsure': 'Not sure',
  };
  return labels[incident || ''] || incident || 'Not specified';
}