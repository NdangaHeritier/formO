import nodemailer from "nodemailer";
import { getServerEnv } from "./env";

export interface TransactionalEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** True when SMTP authentication is configured for transactional email. */
export function isTransactionalEmailConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

/**
 * Sends transactional system emails (e.g., password reset links) using bounded SMTP timeouts.
 */
export async function sendTransactionalEmail(payload: TransactionalEmailPayload): Promise<void> {
  const env = getServerEnv();

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS ?? "",
        }
      : undefined,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}
