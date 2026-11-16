import crypto from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  slugifyProjectName,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validation/projects";
import { HttpError } from "@/server/auth/authorization";

export interface ProjectListItem {
  id: string;
  organizationId: string;
  createdById: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "archived";
  formsCount: number;
  submissionsCount: number;
  latestFormEndpoint: string | null;
  createdAt: string;
  updatedAt: string;
  created: string;
  updated: string;
}

// Base shape shared by list/create/update; submissions aggregation only
// exists on list responses.
export type ProjectBaseItem = Omit<
  ProjectListItem,
  "submissionsCount" | "latestFormEndpoint"
>;

function serializeProject(
  project: {
    id: string;
    organizationId: string;
    createdById: string | null;
    name: string;
    slug: string;
    description: string | null;
    status: "active" | "archived";
    createdAt: Date;
    updatedAt: Date;
    _count?: { forms: number };
  }
): ProjectBaseItem {
  const createdIso = project.createdAt.toISOString();
  const updatedIso = project.updatedAt.toISOString();
  return {
    id: project.id,
    organizationId: project.organizationId,
    createdById: project.createdById,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    formsCount: project._count?.forms ?? 0,
    createdAt: createdIso,
    updatedAt: updatedIso,
    created: createdIso,
    updated: updatedIso,
  };
}

async function resolveUniqueProjectSlug(
  tx: Prisma.TransactionClient,
  organizationId: string,
  desiredSlug: string,
  excludeProjectId?: string
): Promise<string> {
  const existing = await tx.project.findFirst({
    where: {
      organizationId,
      slug: desiredSlug,
      deletedAt: null,
      ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
    },
    select: { id: true },
  });

  if (!existing) {
    return desiredSlug;
  }

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${desiredSlug.slice(0, 54)}-${suffix}`;
}

export async function listWorkspaceProjects(organizationId: string): Promise<ProjectListItem[]> {
  const projects = await prisma.project.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          forms: {
            where: { deletedAt: null },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate live submission counts and the latest form endpoint per project.
  // Forms are fetched once (newest first) so the first form seen per project
  // is that project's latest endpoint.
  const projectIds = projects.map((p) => p.id);
  const submissionsByProject = new Map<string, number>();
  const latestEndpointByProject = new Map<string, string>();

  if (projectIds.length > 0) {
    const forms = await prisma.projectForm.findMany({
      where: {
        projectId: { in: projectIds },
        deletedAt: null,
      },
      select: {
        projectId: true,
        endpoint: true,
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const form of forms) {
      submissionsByProject.set(
        form.projectId,
        (submissionsByProject.get(form.projectId) ?? 0) + form._count.submissions
      );
      if (!latestEndpointByProject.has(form.projectId)) {
        latestEndpointByProject.set(form.projectId, form.endpoint);
      }
    }
  }

  return projects.map((project) => ({
    ...serializeProject(project),
    submissionsCount: submissionsByProject.get(project.id) ?? 0,
    latestFormEndpoint: latestEndpointByProject.get(project.id) ?? null,
  }));
}

export async function getWorkspaceProjectDetail(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      deletedAt: null,
    },
    include: {
      forms: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      },
      _count: {
        select: {
          forms: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const formIds = project.forms.map((f) => f.id);

  // Live per-status counts across all submissions of this project's forms.
  const statusGroups = formIds.length
    ? await prisma.formSubmission.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { formId: { in: formIds } },
      })
    : [];

  const countByStatus = (status: string) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;

  const submissionsStats = {
    total: statusGroups.reduce((sum, g) => sum + g._count._all, 0),
    sent: countByStatus("sent"),
    failed: countByStatus("failed"),
    spam: countByStatus("spam"),
    pending: countByStatus("pending"),
  };

  // Most recent submissions across the project, newest first.
  const recentSubmissions = formIds.length
    ? await prisma.formSubmission.findMany({
        where: { formId: { in: formIds } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          formId: true,
          form: {
            select: { title: true },
          },
        },
      })
    : [];

  return {
    ...serializeProject(project),
    forms: project.forms.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description ?? "",
      endpoint: f.endpoint,
      emailTo: f.emailTo,
      email_to: f.emailTo,
      isActive: f.isActive,
      submissionsCount: f._count.submissions,
      created: f.createdAt.toISOString(),
      updated: f.updatedAt.toISOString(),
    })),
    submissionsStats,
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      formId: s.formId,
      formTitle: s.form.title,
    })),
  };
}

export async function createWorkspaceProject(params: {
  organizationId: string;
  actorUserId: string;
  input: CreateProjectInput;
}): Promise<ProjectBaseItem> {
  const { organizationId, actorUserId, input } = params;
  const baseSlug = input.slug?.trim() || slugifyProjectName(input.name);

  return prisma.$transaction(async (tx) => {
    if (input.slug?.trim()) {
      const collision = await tx.project.findFirst({
        where: {
          organizationId,
          slug: baseSlug,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (collision) {
        throw new HttpError(409, `A project with slug "${baseSlug}" already exists in this workspace`);
      }
    }

    const finalSlug = input.slug?.trim()
      ? baseSlug
      : await resolveUniqueProjectSlug(tx, organizationId, baseSlug);

    const created = await tx.project.create({
      data: {
        organizationId,
        createdById: actorUserId,
        name: input.name.trim(),
        slug: finalSlug,
        description: input.description?.trim() || null,
        status: "active",
      },
      include: {
        _count: {
          select: { forms: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "project.created",
        targetType: "project",
        targetId: created.id,
        metadata: {
          name: created.name,
          slug: created.slug,
        },
      },
    });

    return serializeProject(created);
  });
}

export async function updateWorkspaceProject(params: {
  projectId: string;
  organizationId: string;
  actorUserId: string;
  input: UpdateProjectInput;
}): Promise<ProjectBaseItem> {
  const { projectId, organizationId, actorUserId, input } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
      select: { id: true, slug: true },
    });

    if (!existing) {
      throw new HttpError(404, "Project not found");
    }

    let nextSlug: string | undefined;
    if (input.slug && input.slug !== existing.slug) {
      const collision = await tx.project.findFirst({
        where: {
          organizationId,
          slug: input.slug,
          deletedAt: null,
          id: { not: projectId },
        },
        select: { id: true },
      });
      if (collision) {
        throw new HttpError(409, `A project with slug "${input.slug}" already exists in this workspace`);
      }
      nextSlug = input.slug;
    }

    const updated = await tx.project.update({
      where: { id: projectId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: {
        _count: {
          select: {
            forms: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "project.updated",
        targetType: "project",
        targetId: updated.id,
        metadata: {
          updatedFields: Object.keys(input),
        },
      },
    });

    return serializeProject(updated);
  });
}

export async function deleteWorkspaceProject(params: {
  projectId: string;
  organizationId: string;
  actorUserId: string;
}): Promise<{ id: string; deletedAt: string }> {
  const { projectId, organizationId, actorUserId } = params;
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
      select: { id: true, name: true, slug: true },
    });

    if (!existing) {
      throw new HttpError(404, "Project not found");
    }

    await tx.projectForm.updateMany({
      where: {
        projectId,
        deletedAt: null,
      },
      data: {
        isActive: false,
        deletedAt: now,
      },
    });

    await tx.project.update({
      where: { id: projectId },
      data: {
        status: "archived",
        deletedAt: now,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "project.deleted",
        targetType: "project",
        targetId: projectId,
        metadata: {
          name: existing.name,
          slug: existing.slug,
        },
      },
    });

    return {
      id: projectId,
      deletedAt: now.toISOString(),
    };
  });
}
