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

/** Single role-decision point shared by every workspace/project/form guard. */
export function assertRole(actual: string, minRole: OrgRole, context = "resource"): void {
  const role = normalizeOrgRole(actual);
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, `Insufficient ${context} permissions (requires ${minRole})`);
  }
}

export type ErrorFields = Record<string, string[]>;

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: ErrorFields;

  constructor(
    status: number,
    message: string,
    options?: { code?: string; fields?: ErrorFields }
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = options?.code ?? defaultErrorCode(status);
    this.fields = options?.fields;
  }
}

export function defaultErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "UNPROCESSABLE_ENTITY",
    429: "RATE_LIMITED",
    503: "UNAVAILABLE",
  };
  return codes[status] ?? "ERROR";
}

/** Single error envelope used by every API route. */
export function errorBody(error: unknown): { status: number; body: { error: string; code: string; fields?: ErrorFields } } {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        code: error.code,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    };
  }
  // Prisma errors are plain objects with a `code`; duck typing avoids importing
  // generated classes into the HTTP layer.
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (code === "P2002") {
      return { status: 409, body: { error: "That value is already in use", code: "CONFLICT" } };
    }
    if (code === "P2025") {
      return { status: 404, body: { error: "Resource not found", code: "NOT_FOUND" } };
    }
  }
  return { status: 500, body: { error: "Internal server error", code: "INTERNAL" } };
}

export function jsonErrorResponse(error: unknown) {
  if (!(error instanceof HttpError) && typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (code !== "P2002" && code !== "P2025") {
      console.error("[authz] Unexpected route error:", error);
    }
  } else if (!(error instanceof HttpError)) {
    console.error("[authz] Unexpected route error:", error);
  }
  const { status, body } = errorBody(error);
  return NextResponse.json(body, { status });
}

/** Ready-made 422 response for a failed zod parse in a route handler. */
export function validationErrorResponse(
  error: { issues: Array<{ path: readonly unknown[]; message: string }> },
  fallback: string
) {
  const httpError = validationHttpError(error);
  return NextResponse.json(
    {
      error: error.issues[0]?.message ?? fallback,
      code: httpError.code,
      fields: httpError.fields,
    },
    { status: httpError.status }
  );
}

/** Converts zod issues into the shared validation envelope. */
export function validationHttpError(error: {
  issues: Array<{ path: readonly unknown[]; message: string }>;
}): HttpError {
  const fields: ErrorFields = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "body";
    (fields[key] ??= []).push(issue.message);
  }
  return new HttpError(422, "Validation failed", { code: "VALIDATION", fields });
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  interest: UserInterest;
  onboarding: unknown;
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
      onboarding: true,
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
  assertRole(membership.role, minRole, "workspace");

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
  assertRole(resolved.role, minRole, "workspace");

  return {
    user,
    organization: resolved.organization,
    role,
    sessionId,
  };
}

/**
 * Guard for the non-developer surface. `interest` is a view preference, not a
 * privilege: this gate stops developer-view accounts from reading audience
 * data, while normal workspace roles still decide who may mutate it.
 */
export async function requireNonDeveloperWorkspace(
  minRole: OrgRole = "member"
): Promise<ActiveWorkspaceContext> {
  const workspace = await requireActiveWorkspace(minRole);
  if (workspace.user.interest !== "non_developer") {
    throw new HttpError(403, "This endpoint is only available in the non-developer view");
  }
  return workspace;
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
  const { user, activeOrganizationId } = await requireUser();
  const isUuid = UUID_REGEX.test(projectIdOrSlug);

  // Prefer the active workspace; fall back to the oldest membership when none
  // is active or the active membership no longer exists.
  let organizationId = activeOrganizationId;
  if (organizationId) {
    const activeMembership = await prisma.member.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      select: { id: true },
    });
    if (!activeMembership) organizationId = null;
  }
  if (!organizationId) {
    const oldest = await prisma.member.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { organizationId: true },
    });
    organizationId = oldest?.organizationId ?? null;
  }
  if (!organizationId) throw new HttpError(404, "Project not found");

  const include = {
    organization: {
      include: {
        members: {
          where: { userId: user.id },
          select: { role: true },
          take: 1,
        },
      },
    },
  } as const;
  const baseWhere = { organizationId, deletedAt: null };

  // Order: UUID direct match, then slug, then case-insensitive name.
  let project = await prisma.project.findFirst({
    where: isUuid
      ? { ...baseWhere, id: projectIdOrSlug }
      : { ...baseWhere, slug: projectIdOrSlug },
    include,
  });

  if (!project && !isUuid) {
    const byName = await prisma.project.findMany({
      where: { ...baseWhere, name: { equals: projectIdOrSlug, mode: "insensitive" } },
      include,
    });
    if (byName.length > 1) {
      throw new HttpError(409, "More than one project has that name; use its slug or id");
    }
    project = byName[0] ?? null;
  }

  if (!project || project.organization.members.length === 0) {
    throw new HttpError(404, "Project not found");
  }

  const role = normalizeOrgRole(project.organization.members[0].role);
  assertRole(project.organization.members[0].role, minRole, "project");

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
  assertRole(form.project.organization.members[0].role, minRole, "form");

  return {
    user,
    form,
    organizationId: form.project.organizationId,
    role,
  };
}


