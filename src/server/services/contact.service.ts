import { Prisma } from "@/generated/prisma/client";
import { decodeCursor, encodeCursor } from "@/lib/validation/query";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";

/** Audience-safe projection: no SMTP, endpoint or transport fields. */
const contactSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lists: { select: { list: { select: { id: true, name: true } } } },
  _count: { select: { deliveries: true } },
} satisfies Prisma.ContactSelect;

type ContactRow = Prisma.ContactGetPayload<{ select: typeof contactSelect }>;

function project(row: ContactRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lists: row.lists.map((entry) => ({ id: entry.list.id, name: entry.list.name })),
    deliveryCount: row._count.deliveries,
  };
}

export async function listContacts(params: {
  organizationId: string;
  query?: string;
  listId?: string;
  limit: number;
  cursor?: string;
}) {
  const cursor = decodeCursor(params.cursor);
  if (params.cursor && !cursor) throw new HttpError(400, "Invalid cursor");
  const cursorDate = cursor ? new Date(cursor.createdAt) : null;

  const and: Prisma.ContactWhereInput[] = [];
  const query = params.query?.trim();
  if (query) {
    and.push({
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (params.listId) and.push({ lists: { some: { listId: params.listId } } });
  if (cursor && cursorDate) {
    and.push({
      OR: [
        { createdAt: { lt: cursorDate } },
        { createdAt: cursorDate, id: { lt: cursor.id } },
      ],
    });
  }

  const where: Prisma.ContactWhereInput = {
    organizationId: params.organizationId,
    ...(and.length > 0 ? { AND: and } : {}),
  };
  const rows = await prisma.contact.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit + 1,
    select: contactSelect,
  });
  const total = await prisma.contact.count({ where });

  const hasMore = rows.length > params.limit;
  const page = rows.slice(0, params.limit);
  const last = page.at(-1);
  return {
    items: page.map(project),
    total,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
  };
}

async function scopedContact(organizationId: string, id: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId },
    select: contactSelect,
  });
  if (!contact) throw new HttpError(404, "Contact not found");
  return contact;
}

export async function getContact(id: string, organizationId: string) {
  return project(await scopedContact(organizationId, id));
}

export async function createContact(params: {
  organizationId: string;
  actorUserId: string;
  input: { email: string; name?: string | null; metadata?: Record<string, unknown> | null };
}) {
  const { organizationId, actorUserId, input } = params;
  const email = input.email.trim().toLowerCase();

  return prisma.$transaction(async (tx) => {
    const created = await tx.contact.create({
      data: {
        organizationId,
        email,
        name: input.name ?? null,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact.created",
        targetType: "contact",
        targetId: created.id,
        metadata: { email },
      },
    });
    return created.id;
  }).then((id) => getContact(id, organizationId));
}

export async function updateContact(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
  input: {
    email?: string;
    name?: string | null;
    isActive?: boolean;
    metadata?: Record<string, unknown> | null;
  };
}) {
  const { id, organizationId, actorUserId, input } = params;
  await scopedContact(organizationId, id);

  return prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id },
      data: {
        ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.metadata !== undefined
          ? {
              metadata: input.metadata
                ? (input.metadata as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            }
          : {}),
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact.updated",
        targetType: "contact",
        targetId: id,
      },
    });
  }).then(() => getContact(id, organizationId));
}

/** Deletes the contact; list memberships cascade and deliveries keep the address. */
export async function deleteContact(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { id, organizationId, actorUserId } = params;
  await scopedContact(organizationId, id);

  return prisma.$transaction(async (tx) => {
    await tx.contact.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact.deleted",
        targetType: "contact",
        targetId: id,
      },
    });
    return { id };
  });
}
