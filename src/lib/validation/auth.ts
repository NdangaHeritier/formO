import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  interest: z.enum(["developer", "non_developer"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, "Missing or invalid password reset token"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const interestSchema = z.object({
  interest: z.enum(["developer", "non_developer"]),
}).strict();

/**
 * Prevents open redirects after authentication by permitting only relative internal paths.
 */
export function sanitizeNextPath(rawNext: string | null | undefined, fallback = "/dashboard"): string {
  if (!rawNext) return fallback;
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }
  return trimmed;
}

export function evaluatePasswordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ["Weak", "Fair", "Good", "Strong", "Very strong"];
  return {
    score,
    label: labels[score] ?? "Weak",
  };
}
