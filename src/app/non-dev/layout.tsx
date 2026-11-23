import { redirect } from "next/navigation";
import ForbiddenView from "@/components/Global/ForbiddenView";
import { requireUser } from "@/server/auth/authorization";

/** Audience boundary: a developer account can never render this surface. */
export default async function NonDevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser().catch(() => null);
  if (!session) redirect("/login");

  if (session.user.interest !== "non_developer") {
    return (
      <ForbiddenView
        title="Workspace view unavailable"
        message="Your account was set up for the developer dashboard. The non-developer workspace is not available to this account."
        href="/developer"
        linkLabel="Go to the developer dashboard"
      />
    );
  }

  return <>{children}</>;
}
