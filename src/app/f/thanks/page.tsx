export const metadata = { title: "Thanks — FormO" };

/** Static landing point for plain HTML form posts with no valid redirect. */
export default function ThanksPage() {
  return (
    <main style={{ maxWidth: 40 * 16, margin: "4rem auto", padding: "0 1.5rem", fontFamily: "system-ui" }}>
      <h1>Thanks — we got your message.</h1>
      <p>Your submission has been received. We&apos;ll be in touch soon.</p>
    </main>
  );
}
