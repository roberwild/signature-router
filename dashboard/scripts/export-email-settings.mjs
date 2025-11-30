#!/usr/bin/env node
/* eslint-env node */
/* global process, Buffer */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from '../../../packages/database/node_modules/postgres/src/index.js';
import { eq } from 'drizzle-orm';
import { platformEmailSettingsTable } from '../../../packages/database/src/schema/admin-schema.js';
import crypto from 'crypto';
import fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Simple decryption function (matching EncryptionService)
function decrypt(encryptedData) {
  const algorithm = 'aes-256-gcm';
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY not found in environment variables');
  }

  const keyBuffer = Buffer.from(key, 'base64');
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const tag = Buffer.from(encryptedData.tag, 'base64');
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');

  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, null, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

async function exportEmailSettings() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('   Make sure .env.local exists and contains DATABASE_URL');
    process.exit(1);
  }

  console.log('📧 Exporting Email Settings from Local Database...\n');

  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  try {
    // Fetch active email settings
    const settings = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    if (!settings || settings.length === 0) {
      console.log('❌ No active email settings found in the database');
      await sql.end();
      process.exit(1);
    }

    const emailSettings = settings[0];
    console.log('✅ Found active email configuration\n');
    console.log('='.repeat(60));
    console.log('EMAIL SETTINGS CONFIGURATION');
    console.log('='.repeat(60));

    // Basic settings
    console.log('\n📌 Basic Settings:');
    console.log(`  Provider: ${emailSettings.provider}`);
    console.log(`  From Email: ${emailSettings.emailFrom}`);
    console.log(`  From Name: ${emailSettings.emailFromName || 'Not set'}`);
    console.log(`  Active: ${emailSettings.isActive}`);

    // Features
    console.log('\n🔧 Features Enabled:');
    const features = emailSettings.features;
    if (features) {
      Object.entries(features).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }

    // Decrypt provider configuration
    console.log('\n🔐 Provider Configuration:');
    if (emailSettings.providerConfig) {
      try {
        const decryptedConfig = decrypt(emailSettings.providerConfig);
        const config = JSON.parse(decryptedConfig);

        // Mask sensitive data for display
        const maskedConfig = { ...config };

        // Mask API keys and passwords
        Object.keys(maskedConfig).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('key') ||
              lowerKey.includes('token') ||
              lowerKey.includes('password') ||
              lowerKey.includes('secret')) {
            const value = String(maskedConfig[key]);
            if (value.length > 8) {
              maskedConfig[key] = value.substring(0, 4) + '****' + value.substring(value.length - 4);
            } else {
              maskedConfig[key] = '****';
            }
          }
        });

        console.log('  Configuration (sensitive data masked):');
        Object.entries(maskedConfig).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });

        // Export full configuration for production setup
        console.log('\n' + '='.repeat(60));
        console.log('PRODUCTION DEPLOYMENT INSTRUCTIONS');
        console.log('='.repeat(60));
        console.log('\n1. Environment Variables Required:');
        console.log('   ENCRYPTION_KEY=<generate-new-32-byte-key-for-production>');
        console.log('   DATABASE_URL=<your-production-database-url>');

        console.log('\n2. Email Provider Configuration:');
        console.log('   Navigate to: https://your-domain.com/admin/email-settings');
        console.log('   Select provider: ' + emailSettings.provider.toUpperCase());
        console.log('   Enter the following configuration:\n');

        switch (emailSettings.provider) {
          case 'postmark':
            console.log('   📮 Postmark Settings:');
            console.log('   - Server API Token: <your-postmark-server-token>');
            console.log('   - Message Stream: ' + (config.messageStream || 'outbound'));
            console.log('\n   Get your token from: https://account.postmarkapp.com/servers');
            break;

          case 'sendgrid':
            console.log('   📨 SendGrid Settings:');
            console.log('   - API Key: <your-sendgrid-api-key>');
            console.log('\n   Create API key at: https://app.sendgrid.com/settings/api_keys');
            break;

          case 'resend':
            console.log('   📤 Resend Settings:');
            console.log('   - API Key: <your-resend-api-key>');
            console.log('\n   Get API key from: https://resend.com/api-keys');
            break;

          case 'nodemailer':
            console.log('   📧 SMTP Settings:');
            console.log('   - Host: ' + config.host);
            console.log('   - Port: ' + config.port);
            console.log('   - Secure: ' + (config.secure ? 'Yes (TLS)' : 'No'));
            if (config.auth?.user) {
              console.log('   - Username: ' + config.auth.user);
            }
            console.log('   - Password: <your-smtp-password>');
            break;
        }

        console.log('\n   ✉️  Email Sender Settings:');
        console.log('   - From Email: ' + emailSettings.emailFrom);
        console.log('   - From Name: ' + (emailSettings.emailFromName || '<leave empty or set your brand name>'));

        console.log('\n3. Testing Steps:');
        console.log('   a) Click "Test Connection" to verify provider credentials');
        console.log('   b) Send a test email to confirm delivery works');
        console.log('   c) Save the configuration');
        console.log('   d) Register a test user to verify activation emails');

        // Export safe configuration to JSON
        const exportData = {
          provider: emailSettings.provider,
          emailFrom: emailSettings.emailFrom,
          emailFromName: emailSettings.emailFromName,
          features: emailSettings.features,
          configurationHints: {
            host: config.host || null,
            port: config.port || null,
            secure: config.secure || null,
            messageStream: config.messageStream || null,
            requiresApiKey: ['resend', 'sendgrid'].includes(emailSettings.provider),
            requiresServerToken: emailSettings.provider === 'postmark',
            requiresSmtpAuth: emailSettings.provider === 'nodemailer'
          },
          exportedAt: new Date().toISOString(),
          note: 'Sensitive credentials must be manually configured in production'
        };

        const exportPath = path.resolve(__dirname, '../email-settings-export.json');
        fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

        console.log('\n✅ Configuration exported to:');
        console.log('   ' + exportPath);

        // Show actual values for local reference (if needed)
        console.log('\n' + '='.repeat(60));
        console.log('LOCAL CONFIGURATION VALUES (FOR REFERENCE)');
        console.log('='.repeat(60));
        console.log('⚠️  Keep these values secure - do not share publicly!\n');

        Object.entries(config).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            console.log(`${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              console.log(`  ${subKey}: ${subValue}`);
            });
          } else {
            console.log(`${key}: ${value}`);
          }
        });

      } catch (error) {
        console.error('❌ Failed to decrypt provider configuration:', error.message);
        console.log('\nPossible causes:');
        console.log('- ENCRYPTION_KEY not set in .env.local');
        console.log('- Configuration was encrypted with a different key');
        console.log('- Configuration format is invalid');
      }
    } else {
      console.log('  No provider configuration found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY CHECKLIST');
    console.log('='.repeat(60));
    console.log('☐ Generate a new ENCRYPTION_KEY for production');
    console.log('☐ Store API keys/tokens in environment variables or secrets manager');
    console.log('☐ Use different email provider credentials for production');
    console.log('☐ Set up email domain authentication (SPF, DKIM, DMARC)');
    console.log('☐ Configure rate limiting for email sending');
    console.log('☐ Monitor email delivery and bounce rates');
    console.log('☐ Set up alerts for email service failures\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting email settings:', error);
    await sql.end();
    process.exit(1);
  }
}

// Run the export
exportEmailSettings();