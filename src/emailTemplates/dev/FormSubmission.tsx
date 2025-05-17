import { Html, Head, Body, Container, Section, Heading, Text, Hr } from '@react-email/components';

interface FormSubmissionProps {
  formName: string;
  emailTo: string;
  data: Record<string, string>;
}

export default function FormSubmission({ formName, emailTo, data }: FormSubmissionProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
          <Heading style={{ color: '#333333' }}>New Form Submission - {formName}</Heading>
          <Text style={{ color: '#555555', fontSize: '16px' }}>To: {emailTo}</Text>
          <Hr style={{ borderColor: '#dddddd', margin: '20px 0' }} />
          <Section>
            <Text style={{ color: '#333333', fontSize: '16px', fontWeight: 'bold' }}>Submission Details:</Text>
            {Object.entries(data).map(([key, value]) => (
              <Text key={key} style={{ color: '#555555', fontSize: '16px' }}>
                <strong>{key}:</strong> {value}
              </Text>
            ))}
            <Text style={{ color: '#555555', fontSize: '14px', marginTop: '20px', borderTop: '1px solid rgb(180, 180, 180)' }}>
              Sent via FormO - A self-hosted email platform for developers.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}