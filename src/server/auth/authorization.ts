import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { Organization, Project, ProjectForm, UserInterest } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OrgRole = "member" | "admin" | "owner";

const ROLE_RANK: Record<OrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function normalizeOrgRole(role: string): OrgRole {
  if (role === "owner" || role === "admin" || role === "member") {
    return role;
  }
  return "member";
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function jsonErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("[authz] Unexpected route error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  interest: UserInterest;
  role: string;
}

export interface ActiveWorkspaceContext {
  user: AuthenticatedUser;
  organization: Organization;
  role: OrgRole;
  sessionId: string;
}

export async function getOptionalSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireUser(): Promise<{
  user: AuthenticatedUser;
  sessionId: string;
  activeOrganizationId: string | null;
}> {
  const sessionResult = await getOptionalSession();
  if (!sessionResult?.user || !sessionResult?.session) {
    throw new HttpError(401, "Authentication required");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionResult.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      interest: true,
      role: true,
    },
  });

  if (!dbUser) {
    throw new HttpError(401, "User account no longer exists");
  }

  return {
    user: dbUser,
    sessionId: sessionResult.session.id,
    activeOrganizationId:
      (sessionResult.session as { activeOrganizationId?: string | null }).activeOrganizationId ?? null,
  };
}

export async function requireOrgAccess(
  organizationId: string,
  minRole: OrgRole = "member"
): Promise<{
  user: AuthenticatedUser;
  organization: Organization;
  role: OrgRole;
  sessionId: string;
}> {
  const { user, sessionId } = await requireUser();

  const membership = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    throw new HttpError(404, "Workspace not found");
  }

  const role = normalizeOrgRole(membership.role);
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, `Insufficient workspace permissions (requires ${minRole})`);
  }

  return {
    user,
    organization: membership.organization,
    role,
    sessionId,
  };
}

export async function requireActiveWorkspace(
  minRole: OrgRole = "member"
): Promise<ActiveWorkspaceContext> {
  const { user, sessionId, activeOrganizationId } = await requireUser();

  const membership = activeOrganizationId
    ? await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: activeOrganizationId,
            userId: user.id,
          },
        },
        include: { organization: true },
      })
    : null;

  const resolved =
    membership ??
    (await prisma.member.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { organization: true },
    }));

  if (!resolved) {
    throw new HttpError(403, "No active workspace membership found for account");
  }

  const role = normalizeOrgRole(resolved.role);
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, `Insufficient workspace permissions (requires ${minRole})`);
  }

  return {
    user,
    organization: resolved.organization,
    role,
    sessionId,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireProjectAccess(
  projectIdOrSlug: string,
  minRole: OrgRole = "member"
): Promise<{
  user: AuthenticatedUser;
  project: Project;
  organizationId: string;
  role: OrgRole;
}> {
  const { user } = await requireUser();
  const isUuid = UUID_REGEX.test(projectIdOrSlug);

  const project = await prisma.project.findFirst({
    where: {
      ...(isUuid
        ? { id: projectIdOrSlug }
        : {
            // Resolve by slug first, falling back to the project's display name
            // (case-insensitive) so routes like /developer/projects/Rubi%20Badon work.
            OR: [
              { slug: projectIdOrSlug },
              { name: { equals: projectIdOrSlug, mode: "insensitive" } },
            ],
          }),
      deletedAt: null,
      organization: {
        members: {
          some: { userId: user.id },
        },
      },
    },
    include: {
      organization: {
        include: {
          members: {
            where: { userId: user.id },
            select: { role: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!project || project.organization.members.length === 0) {
    throw new HttpError(404, "Project not found");
  }

  const role = normalizeOrgRole(project.organization.members[0].role);
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, `Insufficient project permissions (requires ${minRole})`);
  }

  return {
    user,
    project,
    organizationId: project.organizationId,
    role,
  };
}

export async function requireFormAccess(
  formId: string,
  minRole: OrgRole = "member"
): Promise<{
  user: AuthenticatedUser;
  form: ProjectForm;
  organizationId: string;
  role: OrgRole;
}> {
  const { user } = await requireUser();

  const form = await prisma.projectForm.findFirst({
    where: {
      id: formId,
      deletedAt: null,
      project: {
        deletedAt: null,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
    },
    include: {
      project: {
        include: {
          organization: {
            include: {
              members: {
                where: { userId: user.id },
                select: { role: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!form || form.project.organization.members.length === 0) {
    throw new HttpError(404, "Form not found");
  }

  const role = normalizeOrgRole(form.project.organization.members[0].role);
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, `Insufficient form permissions (requires ${minRole})`);
  }

  return {
    user,
    form,
    organizationId: form.project.organizationId,
    role,
  };
}
