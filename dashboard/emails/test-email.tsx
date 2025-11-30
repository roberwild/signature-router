import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface TestEmailTemplateProps {
  recipientEmail: string;
  testMessage?: string;
}

export function TestEmailTemplate({
  recipientEmail,
  testMessage = 'This is a test email to verify your email configuration.'
}: TestEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Email Configuration Test</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Email Configuration Test</Heading>
          <Text style={text}>
            Hello {recipientEmail},
          </Text>
          <Text style={text}>
            {testMessage}
          </Text>
          <Text style={text}>
            If you received this email, your email configuration is working correctly.
          </Text>
          <Text style={footer}>
            This is an automated test email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};