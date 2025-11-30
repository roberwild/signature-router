#!/usr/bin/env tsx

/**
 * Test script for email templates
 * Run with: npx tsx scripts/test-email-templates.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { createServiceRequestNotificationEmail, createServiceRequestStatusUpdateEmail } from '../lib/email/templates/service-request-template';
import { createContactFormNotificationEmail, createContactFormAutoResponseEmail } from '../lib/email/templates/contact-form-template';

async function generateTemplatePreview() {
  const outputDir = path.join(process.cwd(), 'email-previews');
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  console.log('🎨 Generating email template previews...\n');
  
  // 1. Service Request Notification (Admin)
  console.log('📧 Service Request Notification (Admin)');
  const serviceRequestNotification = createServiceRequestNotificationEmail({
    serviceName: 'Auditoría de Ciberseguridad',
    serviceType: 'Auditoría',
    organizationName: 'TechCorp Solutions',
    contactName: 'Juan Pérez',
    contactEmail: 'juan@techcorp.com',
    contactPhone: '+52 555 123 4567',
    description: 'Necesitamos una auditoría completa de nuestra infraestructura de seguridad. Hemos experimentado algunos intentos de acceso no autorizado y queremos asegurarnos de que nuestros sistemas están protegidos adecuadamente.',
    urgency: 'high',
    budget: '$10,000 - $15,000 USD',
    timeline: '2-3 semanas',
    requestId: 'req_123456789',
    createdAt: new Date(),
    dashboardUrl: 'https://platform.mineryguard.com/admin/services/req_123456789'
  });
  
  await fs.writeFile(
    path.join(outputDir, 'service-request-notification.html'),
    serviceRequestNotification.html,
    'utf-8'
  );
  console.log('  ✅ HTML saved to: email-previews/service-request-notification.html');
  console.log('  📝 Text version length:', serviceRequestNotification.text.length, 'characters\n');
  
  // 2. Service Request Status Update (Customer)
  console.log('📧 Service Request Status Update (Customer)');
  const serviceStatusUpdate = createServiceRequestStatusUpdateEmail({
    serviceName: 'Auditoría de Ciberseguridad',
    requestId: 'req_123456789',
    contactName: 'Juan',
    newStatus: 'in_progress',
    adminMessage: 'Hemos asignado a nuestro equipo especializado para tu auditoría. El ingeniero Carlos Rodríguez será tu punto de contacto principal y te contactará en las próximas 24 horas.',
    dashboardUrl: 'https://platform.mineryguard.com/track/req_123456789'
  });
  
  await fs.writeFile(
    path.join(outputDir, 'service-status-update.html'),
    serviceStatusUpdate.html,
    'utf-8'
  );
  console.log('  ✅ HTML saved to: email-previews/service-status-update.html');
  console.log('  📝 Text version length:', serviceStatusUpdate.text.length, 'characters\n');
  
  // 3. Contact Form Notification (Admin)
  console.log('📧 Contact Form Notification (Admin)');
  const contactFormNotification = createContactFormNotificationEmail({
    name: 'María González',
    email: 'maria@example.com',
    phone: '+52 555 987 6543',
    subject: 'Urgente: Necesito ayuda con un incidente de seguridad',
    message: `Hola equipo de Minery,

Hemos detectado actividad sospechosa en nuestros servidores esta mañana. 
Varios intentos de acceso fallidos y algunos archivos han sido modificados sin autorización.

Necesitamos ayuda urgente para:
1. Identificar el origen del ataque
2. Evaluar el daño potencial
3. Implementar medidas de seguridad inmediatas

Por favor, contáctenme lo antes posible.

Gracias,
María González
Directora de TI`,
    organizationName: 'Global Tech Industries',
    messageId: 'msg_987654321',
    createdAt: new Date(),
    dashboardUrl: 'https://platform.mineryguard.com/admin/messages/msg_987654321'
  });
  
  await fs.writeFile(
    path.join(outputDir, 'contact-form-notification.html'),
    contactFormNotification.html,
    'utf-8'
  );
  console.log('  ✅ HTML saved to: email-previews/contact-form-notification.html');
  console.log('  📝 Text version length:', contactFormNotification.text.length, 'characters\n');
  
  // 4. Contact Form Auto-Response (Customer)
  console.log('📧 Contact Form Auto-Response (Customer)');
  const contactAutoResponse = createContactFormAutoResponseEmail({
    name: 'María',
    subject: 'Necesito ayuda con un incidente de seguridad',
    ticketId: 'msg_987654321'
  });
  
  await fs.writeFile(
    path.join(outputDir, 'contact-auto-response.html'),
    contactAutoResponse.html,
    'utf-8'
  );
  console.log('  ✅ HTML saved to: email-previews/contact-auto-response.html');
  console.log('  📝 Text version length:', contactAutoResponse.text.length, 'characters\n');
  
  // Create an index HTML file to preview all templates
  const indexHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template Previews - Minery Platform</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: white;
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 40px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }
    .card h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 1.3rem;
    }
    .card p {
      color: #666;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
    .card .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .badge-admin {
      background: #e7f3ff;
      color: #0d47a1;
    }
    .badge-customer {
      background: #e8f5e9;
      color: #1b5e20;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: opacity 0.3s ease;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .timestamp {
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 40px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email Template Previews</h1>
    
    <div class="grid">
      <div class="card">
        <span class="badge badge-admin">Admin</span>
        <h2>Service Request Notification</h2>
        <p>Notificación enviada al administrador cuando se recibe una nueva solicitud de servicio.</p>
        <a href="service-request-notification.html" class="btn" target="_blank">Ver Template</a>
      </div>
      
      <div class="card">
        <span class="badge badge-customer">Customer</span>
        <h2>Service Status Update</h2>
        <p>Actualización de estado enviada al cliente sobre su solicitud de servicio.</p>
        <a href="service-status-update.html" class="btn" target="_blank">Ver Template</a>
      </div>
      
      <div class="card">
        <span class="badge badge-admin">Admin</span>
        <h2>Contact Form Notification</h2>
        <p>Notificación enviada al administrador cuando se recibe un mensaje de contacto.</p>
        <a href="contact-form-notification.html" class="btn" target="_blank">Ver Template</a>
      </div>
      
      <div class="card">
        <span class="badge badge-customer">Customer</span>
        <h2>Contact Form Auto-Response</h2>
        <p>Respuesta automática enviada al usuario tras enviar un mensaje de contacto.</p>
        <a href="contact-auto-response.html" class="btn" target="_blank">Ver Template</a>
      </div>
    </div>
    
    <p class="timestamp">Generated on ${new Date().toLocaleString('es-ES')}</p>
  </div>
</body>
</html>
  `.trim();
  
  await fs.writeFile(
    path.join(outputDir, 'index.html'),
    indexHtml,
    'utf-8'
  );
  
  console.log('🎉 All templates generated successfully!');
  console.log('\n📂 Preview files saved in:', outputDir);
  console.log('🌐 Open email-previews/index.html in your browser to view all templates\n');
}

// Run the script
generateTemplatePreview().catch(console.error);