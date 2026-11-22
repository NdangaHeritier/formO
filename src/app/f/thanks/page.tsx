import Image from "next/image";
export const metadata = { title: "Thanks — FormO" };

/** Static landing point for plain HTML form posts with no valid redirect. */
export default function ThanksPage() {
  return (
    <div className="app-viewport h-dvh overflow-y-auto">
      <main style={{ maxWidth: 40 * 16, margin: "0 auto", padding: "4rem 1.5rem" }} className="flex flex-col items-center justify-center gap-4">
        <Image
          src="/Assets/forms/checked.svg"
          alt="Thanks"
          width={100}
          height={100}
          className="mb-4"
        />
        <h1>Thanks — we got your message.</h1>
        <p>Your submission has been received. We&apos;ll be in touch soon.</p>
      </main>
    </div>
  );
}
