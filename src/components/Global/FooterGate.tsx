"use client";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Footer from "@/components/Footer";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/f/thanks"];

/** Pure decision so the rule can be tested without a browser session. */
export function shouldShowFooter(isLoggedIn: boolean, pathname: string): boolean {
  if (isLoggedIn) return false;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`))
  );
}

/** Marketing chrome only: the footer never appears inside a signed-in workspace. */
export default function FooterGate() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  if (isPending || !shouldShowFooter(Boolean(session?.user), pathname)) return null;
  return <Footer />;
}
