"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Landing point for plain HTML form posts. Shows the FormO thank-you message,
 * then returns the visitor to the site that hosted the form after 3 seconds.
 * Only an absolute http(s) URL from a different origin is accepted as a return
 * target, so a crafted referrer cannot point back at FormO itself.
 */
export default function ThanksRedirect() {
  const [target, setTarget] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    let back: string | null = null;
    const referrer = document.referrer;
    if (referrer) {
      try {
        const url = new URL(referrer);
        if (
          (url.protocol === "https:" || url.protocol === "http:") &&
          url.origin !== window.location.origin
        ) {
          back = url.toString();
        }
      } catch {
        back = null;
      }
    }
    if (!back) return;

    const returnTo = back;
    // Defer the state update so the effect body does not set state synchronously.
    void Promise.resolve().then(() => setTarget(returnTo));
    const timeout = window.setTimeout(() => {
      // External return URL supplied by the referring site, not a Next.js route.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = returnTo;
    }, 3000);
    const interval = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000
    );
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  if (!target) {
    return (
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        You can close this page or return to the site you came from.
      </p>
    );
  }

  return (
    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
      Taking you back to your site in {seconds}s.{" "}
      <Link href={target} className="font-medium text-zinc-800 underline dark:text-zinc-100">
        Go back now
      </Link>
    </p>
  );
}
