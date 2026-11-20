import LegalPage from "@/components/Global/LegalPage";

export const metadata = {
  title: "Privacy Policy — FormO",
  description: "How FormO handles data you submit through the service.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="20 November 2026"
      sections={[
        {
          heading: "Data we store",
          paragraphs: [
            "We store account details you provide (such as your name and email address), the projects and forms you create, the recipient addresses configured for those forms, and the submissions posted to your form endpoints. When you sign in with a social provider, we receive basic profile information from that provider.",
          ],
        },
        {
          heading: "How data is used",
          paragraphs: [
            "Submission data is used to deliver notifications to the recipients you configured and to show you submission history and statistics in your workspace. Account data is used to authenticate you and secure your workspace. We do not sell your data.",
          ],
        },
        {
          heading: "Where data is stored",
          paragraphs: [
            "Application data is stored in a hosted PostgreSQL database. The site is served from Vercel, and transactional email is sent through the SMTP provider configured for the deployment. These providers process data only to operate the service.",
          ],
        },
        {
          heading: "Your choices",
          paragraphs: [
            "You can change or remove forms, recipients, and account details from the dashboard. Removing data from the dashboard removes it from the active workspace; backups and delivery logs may persist for a limited period afterwards.",
          ],
        },
      ]}
    />
  );
}
