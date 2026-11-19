import { describe, expect, it } from "vitest";
import { sanitizeTemplateHtml, sanitizeTemplateSubject } from "@/lib/template-sanitize";

describe("sanitizeTemplateHtml", () => {
  it("removes scripts, event handlers and javascript URLs", () => {
    const html = sanitizeTemplateHtml(
      '<script>alert(1)</script><p onclick="evil()">Hi <b>{{name}}</b></p><a href="javascript:alert(1)">x</a>'
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("{{name}}");
  });

  it("keeps email-safe formatting and https links", () => {
    const html = sanitizeTemplateHtml('<h1 style="color:#000">Hello</h1><a href="https://example.com">Go</a>');
    expect(html).toContain("<h1");
    expect(html).toContain("https://example.com");
  });

  it("keeps placeholder links usable by the renderer", () => {
    const html = sanitizeTemplateHtml('<a href="{{buttonUrl}}">Go</a>');
    expect(html).toContain("{{buttonUrl}}");
  });

  it("drops iframes, forms and style blocks", () => {
    const html = sanitizeTemplateHtml('<iframe src="https://evil.test"></iframe><style>body{}</style><form></form><p>ok</p>');
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<style");
    expect(html).not.toContain("<form");
    expect(html).toContain("ok");
  });
});

describe("sanitizeTemplateSubject", () => {
  it("strips CRLF so header injection is impossible", () => {
    expect(sanitizeTemplateSubject("Hello\r\nBcc: victim@test")).toBe("Hello Bcc: victim@test");
  });
});
