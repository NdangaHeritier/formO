import StarterKit from "@tiptap/starter-kit";
import { TextStyle, Color, FontFamily } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Extension, type JSONContent } from "@tiptap/core";
import type { TemplateValues } from "@/lib/template-design";

export const STUDIO_FONTS = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Courier New", value: "monospace" },
  { label: "System UI", value: "system-ui, sans-serif" },
] as const;

export const STUDIO_FONT_SIZES = ["13px", "15px", "17px", "19px"] as const;
export const BRAND_COLOR_PLACEHOLDER = "__FORMO_BRAND_COLOR__";

export const CTA_LINK_STYLE = [
  "display:inline-block",
  "padding:12px 24px",
  "border-radius:8px",
  `background-color:${BRAND_COLOR_PLACEHOLDER}`,
  "color:#ffffff",
  "font-weight:bold",
  "font-size:14px",
  "text-decoration:none",
].join(";");

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) =>
              attributes.fontSize ? { style: `font-size:${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },
});

/**
 * One extension set shared by the browser editor and the server HTML compiler.
 * Keeping these aligned ensures the canvas and sent email do not silently
 * support different markup or formatting.
 */
export function getEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Mark extensions with custom studio behavior below.
      link: false,
      underline: false,
    }),
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          "data-cta": {
            default: null,
            parseHTML: (element) => element.getAttribute("data-cta"),
            renderHTML: (attributes) =>
              attributes["data-cta"] === "true"
                ? { "data-cta": "true", style: CTA_LINK_STYLE }
                : {},
          },
        };
      },
    }).configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer",
        style: `color:${BRAND_COLOR_PLACEHOLDER}`,
      },
    }),
    Image.configure({
      allowBase64: false,
      HTMLAttributes: {
        // Resize to the available frame without changing the intrinsic ratio.
        // Never upscale a small image or encode files into the document HTML.
        style:
          "display:block;width:auto;max-width:100%;height:auto;object-fit:contain;" +
          "margin:8px auto;border-radius:8px;",
      },
    }),
    Placeholder.configure({ placeholder: "Start writing your email…" }),
  ];
}

/** Converts a legacy variable-based preset into a rich-text document. */
export function documentFromTemplateValues(values: TemplateValues): JSONContent {
  const content: JSONContent[] = [];
  if (values.heading?.trim()) {
    content.push({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: values.heading.trim() }],
    });
  }
  if (values.body?.trim()) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: values.body.trim() }],
    });
  }
  if (values.buttonText?.trim() && values.buttonUrl) {
    content.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: values.buttonText.trim(),
          marks: [{ type: "link", attrs: { href: values.buttonUrl, "data-cta": "true" } }],
        },
      ],
    });
  }
  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content };
}
