import { redirect } from "next/navigation";
import ForbiddenView from "@/components/Global/ForbiddenView";
import { requireUser } from "@/server/auth/authorization";

/** Audience boundary: a non-developer account can never render this surface. */
export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser().catch(() => null);
  if (!session) redirect("/login");

  if (session.user.interest !== "developer") {
    return (
      <ForbiddenView
        title="Developer view unavailable"
        message="Your account was set up for the non-developer workspace. The developer dashboard is not available to this account."
        href="/non-dev"
        linkLabel="Go to your workspace"
      />
    );
  }

  return <>{children}</>;
}
