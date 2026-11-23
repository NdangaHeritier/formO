import { redirect } from "next/navigation";
import ForbiddenView from "@/components/Global/ForbiddenView";
import { AudienceProvider } from "@/components/Header/audience-context";
import { requireActiveWorkspace } from "@/server/auth/authorization";

/** Audience boundary: a developer account can never render this surface. */
export default async function NonDevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = await requireActiveWorkspace("member").catch(() => null);
  if (!workspace) redirect("/login");

  if (workspace.user.interest !== "non_developer") {
    return (
      <ForbiddenView
        title="Workspace view unavailable"
        message="Your account was set up for the developer dashboard. The non-developer workspace is not available to this account."
        href="/developer"
        linkLabel="Go to the developer dashboard"
      />
    );
  }

  return (
    <AudienceProvider
      audience="nonDeveloper"
      canManage={workspace.role === "admin" || workspace.role === "owner"}
    >
      {children}
    </AudienceProvider>
  );
}
