import { z } from "zod";

/**
 * Structured customization data kept alongside compiled template HTML.
 * Preset-specific today, ready to evolve into the studio's block-design JSON.
 */
export const templateDesignSchema = z.object({
  presetId: z.string().trim().min(1).max(64),
  heading: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2_000),
  buttonText: z.string().max(60),
  buttonUrl: z
    .string()
    .max(500)
    .regex(/^(https?:\/\/|\/)/i, "Button URL must start with http(s):// or /"),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, "Invalid brand color"),
  content: z
    .record(z.string(), z.unknown())
    .refine((content) => content.type === "doc", "Template content must be an editor document")
    .optional(),
  fontFamily: z.string().trim().max(120).optional(),
  fontSize: z.enum(["13px", "15px", "17px", "19px"]).optional(),
  brandName: z.string().trim().min(1).max(120).optional(),
});

export const templateValuesSchema = templateDesignSchema.omit({ presetId: true }).partial();

export const templateSchemaParameters = z.object({
  presetId: z.string().trim().min(1).max(64),
}).extend(templateValuesSchema.shape);

export type TemplateDesign = z.infer<typeof templateDesignSchema>;
export type TemplateValues = z.infer<typeof templateValuesSchema>;

export function parseTemplateDesign(value: unknown): TemplateDesign | null {
  const parsed = templateDesignSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
