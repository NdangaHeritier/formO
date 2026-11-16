import { prismaAdapter } from "@better-auth/prisma-adapter";
import crypto from "node:crypto";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { sendTransactionalEmail } from "./mailer";
import { prisma } from "./prisma";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugifyWorkspace(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "workspace"}-${suffix}`;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    async sendResetPassword({ user, url }) {
      const safeName = escapeHtml(user.name || "there");
      const safeUrl = escapeHtml(url);

      try {
        await sendTransactionalEmail({
          to: user.email,
          subject: "Reset your FormO password",
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
              <h2>Reset your FormO password</h2>
              <p>Hi ${safeName},</p>
              <p>Use the single-use link below to choose a new password for your FormO account:</p>
              <p style="margin:24px 0;">
                <a href="${safeUrl}" style="background:#111827;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
                  Reset Password
                </a>
              </p>
              <p style="color:#6b7280;font-size:13px;">If you did not request this email, you can ignore it safely.</p>
            </div>
          `,
          text: `Reset your FormO password: ${url}`,
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[auth] SMTP unavailable in development for reset email:",
            error instanceof Error ? error.message : error
          );
          console.info(`[auth] Development password reset URL for ${user.email}: ${url}`);
          return;
        }
        throw error;
      }
    },
  },
  user: {
    additionalFields: {
      interest: {
        type: "string",
        required: false,
        defaultValue: "developer",
      },
    },
  },
  advanced: {
    database: {
      // Rely on PostgreSQL 18 DEFAULT uuidv7() for sequential UUID primary keys
      generateId: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const existingMembership = await prisma.member.findFirst({
            where: { userId: user.id },
            select: { id: true },
          });
          if (existingMembership) return;

          const workspaceName = `${user.name || "Personal"}'s Workspace`;
          await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
              data: {
                name: workspaceName,
                slug: slugifyWorkspace(user.name || user.email),
              },
            });

            await tx.member.create({
              data: {
                organizationId: org.id,
                userId: user.id,
                role: "owner",
              },
            });
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (session.activeOrganizationId) {
            return { data: session };
          }
          const membership = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
          });
          if (!membership) {
            return { data: session };
          }
          return {
            data: {
              ...session,
              activeOrganizationId: membership.organizationId,
            },
          };
        },
      },
    },
  },
  plugins: [organization(), nextCookies()],
});
