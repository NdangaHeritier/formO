import { describe, expect, it } from "vitest";
import {
  MAX_RENDERED_HTML_BYTES,
  escapeHtml,
  isSingleValidEmail,
  renderEmail,
  renderSubject,
  renderText,
  stripCrlf,
  type RenderContext,
} from "@/server/submissions/render-email";

function context(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    data: { name: "Ada", email: "ada@site.test" },
    title: "Contact form",
    formId: "form-1",
    organizationName: "FormO",
    submissionId: "sub-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    customSubject: null,
    template: null,
    ...overrides,
  };
}

describe("header safety", () => {
  it("strips CR and LF from header values", () => {
    expect(stripCrlf("a\r\nBcc: evil@test")).toBe("a Bcc: evil@test");
  });

  it("escapes HTML metacharacters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });

  it("only accepts a single valid address for reply-to", () => {
    expect(isSingleValidEmail("ada@site.test")).toBe("ada@site.test");
    expect(isSingleValidEmail("a@b.test,c@d.test")).toBeUndefined();
    // Even after CRLF stripping this is not a single valid address, so it is rejected.
    expect(isSingleValidEmail("a@b.test\r\nBcc: evil@test")).toBeUndefined();
    expect(isSingleValidEmail(undefined)).toBeUndefined();
  });
});

describe("subject rendering", () => {
  it("uses customSubject first, then template, then a default", () => {
    expect(renderSubject(context({ customSubject: "Hello {{name}}" }))).toBe("Hello Ada");
    expect(
      renderSubject(
        context({
          template: { subjectTemplate: "T: {{name}}", htmlTemplate: "" },
        })
      )
    ).toBe("T: Ada");
    expect(renderSubject(context())).toBe("New submission: Contact form");
  });

  it("strips CRLF injected through a submitted value", () => {
    const subject = renderSubject(
      context({
        customSubject: "{{name}}",
        data: { name: "Ada\r\nBcc: evil@test" },
      })
    );
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("renders unknown placeholders as empty", () => {
    expect(renderSubject(context({ customSubject: "Hi {{unknown}}" }))).toBe("Hi");
  });
});

describe("HTML rendering", () => {
  it("HTML-escapes submitted values in custom templates", async () => {
    const { html } = await renderEmail(
      context({
        data: { name: "<script>alert(1)</script>" },
        template: { subjectTemplate: "s", htmlTemplate: "<p>{{name}}</p>" },
      })
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("renders unknown placeholders as empty", async () => {
    const { html } = await renderEmail(
      context({ template: { subjectTemplate: "s", htmlTemplate: "[{{missing}}]" } })
    );
    expect(html).toBe("[]");
  });

  it("produces a non-empty default email with no custom template", async () => {
    const { html } = await renderEmail(context());
    expect(html.length).toBeGreaterThan(50);
    expect(Buffer.byteLength(html, "utf8")).toBeLessThanOrEqual(MAX_RENDERED_HTML_BYTES);
  });
});

describe("oversized rendering", () => {
  it("falls back to plain text instead of truncating HTML mid-tag", async () => {
    const huge = "x".repeat(210 * 1024);
    const result = await renderEmail(
      context({
        data: { name: "Ada", email: "ada@site.test", blob: huge },
        template: {
          subjectTemplate: "s",
          htmlTemplate: `<p>{{blob}}</p><div class="tail">after</div>`,
        },
      })
    );
    expect(result.oversized).toBe(true);
    expect(result.html).not.toContain("class=\"tail\"");
    expect(result.html).not.toContain(huge);
    expect(result.html).toContain("too large");
    expect(result.text).toContain("name: Ada");
    expect(result.text).toContain(`blob: ${huge}`.slice(0, 100));
  });

  it("does not report a normal template as oversized", async () => {
    const result = await renderEmail(
      context({ template: { subjectTemplate: "s", htmlTemplate: "<p>{{name}}</p>" } })
    );
    expect(result.oversized).toBe(false);
    expect(result.html).toBe("<p>Ada</p>");
  });
});

describe("plain-text alternative", () => {
  it("includes the form title and every field", () => {
    const text = renderText(context());
    expect(text).toContain("Contact form");
    expect(text).toContain("name: Ada");
    expect(text).toContain("email: ada@site.test");
  });
});

