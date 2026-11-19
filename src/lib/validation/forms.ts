import { z } from "zod";
import { templateDesignSchema } from "@/lib/template-design";

export const formEndpointRegex = /^[A-Za-z0-9_-]{6,64}$/;

const originEntrySchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (val === "*") return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Each allowed origin must be a valid http(s) origin or '*'" }
  );

export const recipientEntrySchema = z.object({
  email: z.string().trim().email("Recipient must be a valid email address").toLowerCase(),
  type: z.enum(["to", "cc", "bcc"]).default("to"),
});

export const createFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Form title must be at least 2 characters")
      .max(100, "Form title must be at most 100 characters"),
    description: z.string().trim().max(500).optional().nullable(),
    endpoint: z
      .string()
      .trim()
      .regex(
        formEndpointRegex,
        "Endpoint must be 6â€“64 characters containing only letters, numbers, underscores, or hyphens"
      )
      .optional()
      .or(z.literal("")),
    emailTo: z.string().trim().email("Enter a valid notification recipient email").toLowerCase(),
    recipients: z.array(recipientEntrySchema).max(20).optional(),
    replyToField: z.string().trim().max(64).optional().nullable(),
    customSubject: z.string().trim().max(160).optional().nullable(),
    allowedOrigins: z.array(originEntrySchema).max(25).optional(),
    honeypotField: z.string().trim().max(64).optional().nullable(),
    requireTurnstile: z.boolean().optional(),
    maxPayloadBytes: z.coerce.number().int().min(1024).max(524288).optional(),
    isActive: z.boolean().optional(),
    smtpConfigId: z.string().uuid().optional().nullable(),
    emailTemplateId: z.string().uuid().optional().nullable(),
  })
  .strict();

export const updateFormSchema = z
  .object({
    title: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    emailTo: z.string().trim().email().toLowerCase().optional(),
    recipients: z.array(recipientEntrySchema).max(20).optional(),
    replyToField: z.string().trim().max(64).optional().nullable(),
    customSubject: z.string().trim().max(160).optional().nullable(),
    allowedOrigins: z.array(originEntrySchema).max(25).optional(),
    honeypotField: z.string().trim().max(64).optional().nullable(),
    requireTurnstile: z.boolean().optional(),
    maxPayloadBytes: z.coerce.number().int().min(1024).max(524288).optional(),
    isActive: z.boolean().optional(),
    smtpConfigId: z.string().uuid().optional().nullable(),
    emailTemplateId: z.string().uuid().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one form field must be provided for update",
  })
  .strict();

export const createSmtpConfigSchema = z.object({
  name: z.string().trim().min(2, "SMTP label must be at least 2 characters").max(80),
  host: z.string().trim().min(3, "Enter a valid SMTP hostname").max(255),
  port: z.coerce.number().int().min(1).max(65535).default(587),
  secure: z.boolean().default(false),
  username: z.string().trim().min(1, "SMTP username is required").max(255),
  password: z.string().min(1, "SMTP password is required").max(512),
  fromEmail: z.string().trim().email("From address must be a valid email").toLowerCase(),
}).strict();

export const createEmailTemplateSchema = z.object({
  name: z.string().trim().min(2, "Template name must be at least 2 characters").max(80),
  subjectTemplate: z
    .string()
    .trim()
    .min(1, "Subject template is required")
    .max(200),
  htmlTemplate: z
    .string()
    .trim()
    .min(1, "HTML template body is required")
    .max(100_000, "HTML template must be under 100 KB"),
  design: templateDesignSchema.optional(),
  isDefault: z.boolean().optional().default(false),
}).strict();

export const createApiKeySchema = z.object({
  name: z.string().trim().min(2, "API key label must be at least 2 characters").max(80),
  scopes: z
    .array(z.enum(["forms:read", "forms:write", "submissions:read", "emails:send"]))
    .min(1)
    .optional(),
  expiresAt: z.string().datetime().optional().nullable(),
}).strict();

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type CreateSmtpConfigInput = z.infer<typeof createSmtpConfigSchema>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

