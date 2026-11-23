import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";

const listSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { members: true } },
} satisfies Prisma.ContactListSelect;

type ListRow = Prisma.ContactListGetPayload<{ select: typeof listSelect }>;

function project(row: ListRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contactCount: row._count.members,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function scopedList(organizationId: string, id: string) {
  const list = await prisma.contactList.findFirst({
    where: { id, organizationId },
    select: listSelect,
  });
  if (!list) throw new HttpError(404, "List not found");
  return list;
}

export async function listContactLists(organizationId: string) {
  const rows = await prisma.contactList.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: listSelect,
  });
  return { lists: rows.map(project) };
}

export async function getContactList(id: string, organizationId: string) {
  return project(await scopedList(organizationId, id));
}

export async function createContactList(params: {
  organizationId: string;
  actorUserId: string;
  input: { name: string; description?: string | null };
}) {
  const { organizationId, actorUserId, input } = params;
  return prisma.$transaction(async (tx) => {
    const created = await tx.contactList.create({
      data: {
        organizationId,
        name: input.name.trim(),
        description: input.description ?? null,
      },
      select: listSelect,
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact_list.created",
        targetType: "contact_list",
        targetId: created.id,
        metadata: { name: created.name },
      },
    });
    return project(created);
  });
}

export async function updateContactList(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
  input: { name?: string; description?: string | null };
}) {
  const { id, organizationId, actorUserId, input } = params;
  await scopedList(organizationId, id);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.contactList.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
      select: listSelect,
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact_list.updated",
        targetType: "contact_list",
        targetId: id,
      },
    });
    return project(updated);
  });
}

export async function deleteContactList(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { id, organizationId, actorUserId } = params;
  await scopedList(organizationId, id);

  return prisma.$transaction(async (tx) => {
    await tx.contactList.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact_list.deleted",
        targetType: "contact_list",
        targetId: id,
      },
    });
    return { id };
  });
}

/** Members are projected as contact summaries, never as delivery config. */
export async function listListMembers(id: string, organizationId: string) {
  await scopedList(organizationId, id);
  const members = await prisma.contactListMember.findMany({
    where: { listId: id },
    orderBy: { addedAt: "desc" },
    select: {
      addedAt: true,
      contact: { select: { id: true, email: true, name: true, isActive: true } },
    },
  });
  return {
    members: members.map((member) => ({
      id: member.contact.id,
      email: member.contact.email,
      name: member.contact.name,
      isActive: member.contact.isActive,
      addedAt: member.addedAt.toISOString(),
    })),
  };
}

export async function addListMembers(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
  contactIds: string[];
}) {
  const { id, organizationId, actorUserId, contactIds } = params;
  await scopedList(organizationId, id);

  const contacts = await prisma.contact.findMany({
    where: { id: { in: contactIds }, organizationId },
    select: { id: true },
  });
  if (contacts.length !== new Set(contactIds).size) {
    throw new HttpError(400, "One or more contacts were not found in this workspace");
  }

  const added = await prisma.$transaction(async (tx) => {
    const result = await tx.contactListMember.createMany({
      data: contactIds.map((contactId) => ({ listId: id, contactId })),
      skipDuplicates: true,
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact_list.members_added",
        targetType: "contact_list",
        targetId: id,
        metadata: { count: result.count },
      },
    });
    return result.count;
  });
  return { added };
}

export async function removeListMember(params: {
  id: string;
  contactId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { id, contactId, organizationId, actorUserId } = params;
  await scopedList(organizationId, id);

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.contactListMember.deleteMany({ where: { listId: id, contactId } });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "contact_list.member_removed",
        targetType: "contact_list",
        targetId: id,
        metadata: { contactId },
      },
    });
    return deleted.count;
  });
  if (result === 0) throw new HttpError(404, "Contact is not a member of this list");
  return { removed: result };
}
