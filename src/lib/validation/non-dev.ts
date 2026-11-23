import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(320)
  .regex(/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/, "Enter a valid email address");

const nameSchema = z.string().trim().min(1).max(160);
const metadataSchema = z.record(z.string(), z.unknown());

export const paginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().min(1).max(500).optional(),
  })
  .strict();

export const createContactSchema = z
  .object({
    email: emailSchema,
    name: nameSchema.nullable().optional(),
    metadata: metadataSchema.nullable().optional(),
  })
  .strict();

export const updateContactSchema = z
  .object({
    email: emailSchema.optional(),
    name: nameSchema.nullable().optional(),
    isActive: z.boolean().optional(),
    metadata: metadataSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "No fields to update");

export const createContactListSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

export const updateContactListSchema = createContactListSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No fields to update");

export const listMembersSchema = z
  .object({
    contactIds: z.array(z.string().uuid()).min(1).max(500),
  })
  .strict();

export const createMessageSchema = z
  .object({
    name: nameSchema,
    subject: z.string().trim().min(1).max(200),
    htmlBody: z.string().min(1).max(200_000),
    textBody: z.string().max(200_000).optional(),
    templateId: z.string().uuid().nullable().optional(),
    contactIds: z.array(z.string().uuid()).max(1000).default([]),
    listIds: z.array(z.string().uuid()).max(100).default([]),
    emails: z.array(emailSchema).max(1000).default([]),
    scheduledAt: z.string().datetime().nullable().optional(),
  })
  .strict()
  .refine(
    (value) => value.contactIds.length + value.listIds.length + value.emails.length > 0,
    "Choose at least one recipient"
  );

export const messageStatusSchema = z.enum([
  "draft",
  "queued",
  "sending",
  "sent",
  "failed",
  "canceled",
]);

export const deliveryStatusSchema = z.enum([
  "pending",
  "processing",
  "sent",
  "retrying",
  "failed",
  "dead_letter",
]);
