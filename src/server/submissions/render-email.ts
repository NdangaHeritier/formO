import { createElement } from "react";
import { render } from "@react-email/render";
import FormSubmission from "@/emailTemplates/dev/FormSubmission";

export const MAX_RENDERED_HTML_BYTES = 200 * 1024;
const MAX_SUBJECT_LENGTH = 200;
const PLACEHOLDER = /\{\{\s*([\w.\-]+)\s*\}\}/g;

export type RenderContext = {
  data: Record<string, string>;
  title: string;
  formId: string;
  organizationName: string;
  submissionId: string;
  createdAt: Date;
  customSubject: string | null;
  template: { subjectTemplate: string; htmlTemplate: string } | null;
};

/** Header values must never contain line breaks. */
export function stripCrlf(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

/** A reply-to is only set for a single, syntactically valid address. */
export function isSingleValidEmail(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const candidate = stripCrlf(value).trim();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(candidate)) return undefined;
  if (/[,;]/.test(candidate)) return undefined;
  return candidate;
}

function knownValue(context: RenderContext, token: string, forHtml: boolean): string {
  let value: string;
  switch (token) {
    case "form.title":
      value = context.title;
      break;
    case "form.id":
      value = context.formId;
      break;
    case "site.name":
      value = context.organizationName;
      break;
    case "submission.id":
      value = context.submissionId;
      break;
    case "submission.createdAt":
      value = context.createdAt.toISOString();
      break;
    default: {
      const key = token.startsWith("submission.") ? token.slice("submission.".length) : token;
      value = context.data[key] ?? ""; // unknown placeholders render empty
      break;
    }
  }
  // Subject is plain text; HTML interpolation is always escaped.
  return forHtml ? escapeHtml(value) : value;
}

function substitute(input: string, context: RenderContext, forHtml: boolean): string {
  return input.replace(PLACEHOLDER, (_match, token: string) => knownValue(context, token, forHtml));
}

export function renderSubject(context: RenderContext): string {
  const source =
    context.customSubject ||
    context.template?.subjectTemplate ||
    `New submission: ${context.title}`;
  return stripCrlf(substitute(source, context, false)).trim().slice(0, MAX_SUBJECT_LENGTH);
}

export type RenderedEmail = {
  html: string;
  text: string;
  oversized: boolean;
};

export function renderText(context: RenderContext): string {
  const lines = Object.entries(context.data).map(([key, value]) => `${key}: ${value}`);
  return [`New submission: ${context.title}`, "", ...lines].join("\n").slice(0, MAX_RENDERED_HTML_BYTES);
}

/**
 * Renders HTML and its plain-text alternative together. An oversized template
 * is never cut mid-tag: the plain-text body is sent instead and the HTML part
 * becomes a short notice.
 */
export async function renderEmail(context: RenderContext): Promise<RenderedEmail> {
  const template = context.template;
  let html = template
    ? substitute(template.htmlTemplate, context, true)
    : await render(
        createElement(FormSubmission, {
          formName: context.title,
          emailTo: context.data.email ?? "",
          data: context.data,
        })
      );

  const text = renderText(context);
  if (Buffer.byteLength(html, "utf8") > MAX_RENDERED_HTML_BYTES) {
    return {
      html: `<p>This submission was too large to render as HTML. The full details are in the plain-text part of this message.</p>`,
      text,
      oversized: true,
    };
  }
  return { html, text, oversized: false };
}
