import { redirect } from "next/navigation";
import ForbiddenView from "@/components/Global/ForbiddenView";
import { AudienceProvider } from "@/components/Header/audience-context";
import { requireActiveWorkspace } from "@/server/auth/authorization";

/** Audience boundary: a non-developer account can never render this surface. */
export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = await requireActiveWorkspace("member").catch(() => null);
  if (!workspace) redirect("/login");

  if (workspace.user.interest !== "developer") {
    return (
      <ForbiddenView
        title="Developer view unavailable"
        message="Your account was set up for the non-developer workspace. The developer dashboard is not available to this account."
        href="/non-dev"
        linkLabel="Go to your workspace"
      />
    );
  }

  return (
    <AudienceProvider
      audience="developer"
      canManage={workspace.role === "admin" || workspace.role === "owner"}
    >
      {children}
    </AudienceProvider>
  );
}
