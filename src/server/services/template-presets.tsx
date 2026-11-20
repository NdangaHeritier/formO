import { render } from "@react-email/render";
import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/core";
import sanitizeHtml from "sanitize-html";
import {
  BRAND_COLOR_PLACEHOLDER,
  getEditorExtensions,
} from "@/components/Developer/Templates/editor/schema";
import {
  Announcement,
  SubmissionAlert,
  TemplateFrame,
  WelcomeMessage,
  type PresetValues,
} from "@/emailTemplates/library/presets";

/**
 * Server-side preset registry. Metadata is exposed to the client via
 * GET /api/templates/presets; rendering happens only on the server
 * (POST /api/templates/preview, POST /api/templates/test-send).
 */

export type PresetMeta = {
  id: string;
  name: string;
  description: string;
  subject: string;
  defaults: Omit<PresetValues, "siteName">;
};

export const PRESET_TEMPLATES: PresetMeta[] = [
  {
    id: "submission-alert",
    name: "Submission Alert",
    description: "Instant notification when a form receives a new submission.",
    subject: "New submission on {{form.title}}",
    defaults: {
      heading: "You've got a new submission",
      body: "Someone just submitted your form. Open your workspace to review the details and follow up while it's fresh.",
      buttonText: "View submission",
      buttonUrl: "https://example.com/submissions",
      brandColor: "#18181b",
    },
  },
  {
    id: "welcome-message",
    name: "Welcome Message",
    description: "A friendly onboarding email for new signups or subscribers.",
    subject: "Welcome to {{site.name}}",
    defaults: {
      heading: "Welcome aboard!",
      body: "Thanks for joining. Your account is ready — jump in and explore everything you can build.",
      buttonText: "Get started",
      buttonUrl: "https://example.com/dashboard",
      brandColor: "#18181b",
    },
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "Product updates, newsletters, and anything worth shouting about.",
    subject: "What's new at {{site.name}}",
    defaults: {
      heading: "Here's what's new",
      body: "We've been shipping improvements you asked for — take a look at what changed this month.",
      buttonText: "Read more",
      buttonUrl: "https://example.com/changelog",
      brandColor: "#18181b",
    },
  },
];

export function getPreset(presetId: string): PresetMeta | undefined {
  return PRESET_TEMPLATES.find((p) => p.id === presetId);
}

/** Compiles a preset (with customized values) into send-ready HTML. */
export async function renderPresetHtml(
  presetId: string,
  values: Partial<PresetValues> & {
    siteName: string;
    content?: JSONContent;
    fontFamily?: string;
    fontSize?: string;
    brandName?: string;
  }
): Promise<string> {
  const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
  if (!preset) {
    throw new Error(`Unknown template preset "${presetId}"`);
  }

  const merged: PresetValues = {
    heading: values.heading?.trim() || preset.defaults.heading,
    body: values.body?.trim() || preset.defaults.body,
    buttonText: values.buttonText ?? preset.defaults.buttonText,
    buttonUrl: values.buttonUrl?.trim() || preset.defaults.buttonUrl,
    brandColor: values.brandColor?.trim() || preset.defaults.brandColor,
    siteName: values.brandName?.trim() || values.siteName,
  };

  // Rich documents go through the browser/server-shared schema, then are
  // sanitized before interpolation into the React Email frame.
  if (values.content) {
    const formatted = generateHTML(values.content, getEditorExtensions()).replaceAll(
      BRAND_COLOR_PLACEHOLDER,
      merged.brandColor
    );
    const clean = sanitizeHtml(formatted, {
      allowedTags: [
        "a", "b", "blockquote", "br", "div", "em", "h1", "h2", "h3", "hr", "i",
        "img", "li", "ol", "p", "s", "span", "strong", "u", "ul",
      ],
      allowedAttributes: {
        "*": [
          "alt", "class", "data-cta", "height", "href", "rel", "src", "style", "target",
          "title", "width",
        ],
      },
    });

    return render(
      <TemplateFrame
        preview={merged.heading}
        brandColor={merged.brandColor}
        siteName={merged.siteName}
      >
        <div
          style={{
            fontFamily: values.fontFamily || "Arial, sans-serif",
            fontSize: values.fontSize || "15px",
            color: "#52525b",
            lineHeight: 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      </TemplateFrame>
    );
  }

  const components = {
    "submission-alert": SubmissionAlert,
    "welcome-message": WelcomeMessage,
    announcement: Announcement,
  } as const;

  const Component = components[preset.id as keyof typeof components];
  const html = await render(<Component {...merged} />);
  return html;
}
