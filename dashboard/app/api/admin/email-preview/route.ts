import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import * as React from 'react';
import { VerifyEmailAddressEmail } from '@workspace/email/templates/verify-email-address-email';
import { WelcomeEmail } from '@workspace/email/templates/welcome-email';
import { PasswordResetEmail } from '@workspace/email/templates/password-reset-email';
import { ConfirmEmailAddressChangeEmail } from '@workspace/email/templates/confirm-email-address-change-email';
import { InvitationEmail } from '@workspace/email/templates/invitation-email';
import { RevokedInvitationEmail } from '@workspace/email/templates/revoked-invitation-email';
import { ConnectedAccountSecurityAlertEmail } from '@workspace/email/templates/connected-account-security-alert-email';
import { ContactMessageEmail } from '@workspace/email/templates/contact-message-email';
import { FeedbackEmail } from '@workspace/email/templates/feedback-email';
import { auth } from '@workspace/auth';

// Define email props types
type EmailProps = Record<string, unknown>;

// Map template names to components with proper typing
const templateComponents: Record<string, (props: EmailProps) => React.JSX.Element> = {
  'verify-email': VerifyEmailAddressEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'welcome': WelcomeEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'password-reset': PasswordResetEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'email-change': ConfirmEmailAddressChangeEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'invitation': InvitationEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'revoked-invitation': RevokedInvitationEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'security-alert': ConnectedAccountSecurityAlertEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'contact-message': ContactMessageEmail as unknown as (props: EmailProps) => React.JSX.Element,
  'feedback': FeedbackEmail as unknown as (props: EmailProps) => React.JSX.Element,
};

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // TODO: Add proper admin role check
    // For now, we'll allow any authenticated user to preview templates
    // In production, you should check if the user has admin privileges

    const searchParams = request.nextUrl.searchParams;
    const template = searchParams.get('template');
    const dataParam = searchParams.get('data');

    if (!template || !templateComponents[template]) {
      return new NextResponse('Invalid template', { status: 400 });
    }

    let data = {};
    if (dataParam) {
      try {
        data = JSON.parse(decodeURIComponent(dataParam));
      } catch (e) {
        console.error('Failed to parse template data:', e);
      }
    }

    // Get the component and render it
    const Component = templateComponents[template];
    const html = await render(Component(data));

    // Add some basic styles to make the preview look better
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              background: #f5f5f5;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    return new NextResponse(styledHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN', // Security: only allow iframe from same origin
      },
    });
  } catch (error) {
    console.error('Error rendering email template:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}