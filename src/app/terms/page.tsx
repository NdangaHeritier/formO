import LegalPage from "@/components/Global/LegalPage";

export const metadata = {
  title: "Terms of Service — FormO",
  description: "Terms governing your use of FormO.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="20 November 2026"
      sections={[
        {
          heading: "Using FormO",
          paragraphs: [
            "FormO lets you create projects and forms, receive submissions from your own websites, and have those submissions delivered to the email recipients you configure. You are responsible for the forms you build, the data you collect through them, and the recipient addresses you provide.",
            "You must use FormO lawfully and must not use it to send unsolicited bulk mail, harvest personal data without a lawful basis, or interfere with the operation of the service.",
          ],
        },
        {
          heading: "Accounts and security",
          paragraphs: [
            "You are responsible for keeping your account credentials and API keys confidential. Anything done with your credentials is attributed to your account. If you believe your credentials have been compromised, rotate them and contact us.",
          ],
        },
        {
          heading: "Submissions and delivery",
          paragraphs: [
            "Submissions are persisted when received. Email delivery is attempted asynchronously and can be retried; a temporary SMTP or provider failure does not delete a submission. Delivery timing depends on your configured mail provider and the worker schedule.",
          ],
        },
        {
          heading: "Availability and changes",
          paragraphs: [
            "FormO is provided on a best-effort basis. Features may change as the service evolves. We may suspend or terminate accounts that violate these terms or that put other users or the infrastructure at risk.",
          ],
        },
      ]}
    />
  );
}
