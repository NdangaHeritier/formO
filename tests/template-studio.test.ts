import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderPresetHtml } from "../src/server/services/template-presets";

const richDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Inline editing <script>alert('safe')</script>" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Formatted with a CTA",
          marks: [{ type: "link", attrs: { href: "https://example.com/start", "data-cta": "true" } }],
        },
      ],
    },
  ],
};

test("rich studio documents compile to branded email-safe HTML", async () => {
  const html = await renderPresetHtml("welcome-message", {
    siteName: "FormO",
    content: richDocument,
    brandColor: "#cf1527",
  });

  assert.ok(html.includes("#cf1527"));
  assert.ok(html.includes("data-cta"));
  assert.ok(!html.includes("__FORMO_BRAND_COLOR__"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("Formatted with a CTA"));
});

test("plain-text formatting controls survive compiled rich content", async () => {
  const html = await renderPresetHtml("welcome-message", {
    siteName: "FormO",
    content: {
      type: "doc",
      content: [{
        type: "paragraph",
        content: [{
          type: "text",
          text: "Styled text",
          marks: [{ type: "textStyle", attrs: { color: "#aaef10", fontFamily: "Georgia, serif", fontSize: "19px" } }],
        }],
      }],
    },
  });
  assert.ok(html.includes("#aaef10"));
  assert.ok(html.includes("19px"));
  assert.ok(html.includes("Georgia, serif"));
});

test("inserted images stay fluid in the compiled template", async () => {
  const html = await renderPresetHtml("welcome-message", {
    siteName: "FormO",
    content: {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "https://example.com/banner.png", alt: "Banner", width: 1200 },
        },
      ],
    },
  });

  assert.match(html, /max-width:\s*100%/);
  assert.match(html, /width:\s*auto/);
  assert.match(html, /height:\s*auto/);
  assert.ok(!html.includes("data:image/"));
});
