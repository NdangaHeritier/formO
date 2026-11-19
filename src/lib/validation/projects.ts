import crypto from "node:crypto";
import { z } from "zod";

export const projectSlugRegex = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(80, "Project name must be at most 80 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      projectSlugRegex,
      "Slug must contain only lowercase letters, numbers, and hyphens (2–64 characters)"
    )
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
}).strict();

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(80, "Project name must be at most 80 characters")
      .optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        projectSlugRegex,
        "Slug must contain only lowercase letters, numbers, and hyphens (2–64 characters)"
      )
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, "Description must be at most 500 characters")
      .optional()
      .nullable(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one project field must be provided for update",
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export function slugifyProjectName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  if (base.length >= 2) {
    return base;
  }

  return `project-${crypto.randomBytes(3).toString("hex")}`;
}
