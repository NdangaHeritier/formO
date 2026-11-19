import DOMPurify from "isomorphic-dompurify";

/** Email-safe subset: no scripts, forms, iframes, style blocks or event handlers. */
const ALLOWED_TAGS = [
  "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3",
  "hr", "i", "img", "li", "ol", "p", "pre", "span", "strong", "table",
  "tbody", "td", "th", "thead", "tr", "u", "ul",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "style", "width", "height", "align", "data-cta"];

/** Allows normal links plus `{{placeholder}}` values used by the renderer. */
const ALLOWED_URI = /^(?:(?:https?:|mailto:)|{{[^{}]+}}|\/|#)/i;

export function sanitizeTemplateHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: ALLOWED_URI,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "svg", "math"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "srcdoc", "formaction"],
  });
}

/** Subject stays plain text; only line breaks and control characters are removed. */
export function sanitizeTemplateSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, 200);
}
