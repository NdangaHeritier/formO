import sanitizeHtml from "sanitize-html";

/** Email-safe subset: no scripts, forms, iframes, style blocks or event handlers. */
const ALLOWED_TAGS = [
  "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3",
  "hr", "i", "img", "li", "ol", "p", "pre", "span", "strong", "table",
  "tbody", "td", "th", "thead", "tr", "u", "ul",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "style", "width", "height", "align", "data-cta"];

/**
 * Server-safe HTML sanitizer. `isomorphic-dompurify` pulls in jsdom, which
 * crashes in the Node runtime; sanitize-html needs no DOM.
 */
export function sanitizeTemplateHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTR },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}

/** Subject stays plain text; only line breaks and control characters are removed. */
export function sanitizeTemplateSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, 200);
}
