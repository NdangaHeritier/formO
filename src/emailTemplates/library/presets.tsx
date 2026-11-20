import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * Pre-designed email template library (Phase 1).
 *
 * Each preset is a fixed, email-safe React Email layout with editable
 * content variables (heading/body/button) and a theme (brand color +
 * site name). The customization studio (Phase 2) will replace these
 * variables with a block-based design JSON — the variables below map
 * 1:1 to future block props.
 *
 * Email-client rules respected here: table-friendly components from
 * @react-email, inline styles only, 600px card, no alpha-hex tricks.
 */

export type PresetValues = {
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  brandColor: string;
  siteName: string;
};

type PresetProps = PresetValues & {
  /** Accessible/plain-text preview line shown before the HTML renders. */
  preview?: string;
};

const DEFAULT_BRAND = "#18181b";

const colors = {
  pageBg: "#f4f4f5",
  cardBg: "#ffffff",
  border: "#e4e4e7",
  heading: "#18181b",
  body: "#52525b",
  muted: "#a1a1aa",
  softBg: "#fafafa",
};

export function TemplateFrame({
  preview,
  brandColor,
  siteName,
  children,
}: {
  preview: string;
  brandColor: string;
  siteName: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: colors.pageBg, fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "32px auto",
            backgroundColor: colors.cardBg,
            borderRadius: "16px",
            overflow: "hidden",
            border: `1px solid ${colors.border}`,
          }}
        >
          {/* brand header band */}
          <Section style={{ backgroundColor: brandColor, padding: "20px 36px" }}>
            <Text
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "0.6px",
              }}
            >
              {siteName}
            </Text>
          </Section>

          {/* content */}
          <Section style={{ padding: "36px" }}>{children}</Section>

          <Hr style={{ borderColor: colors.border, margin: "0 36px" }} />

          {/* footer */}
          <Section style={{ padding: "20px 36px 28px" }}>
            <Text style={{ margin: 0, color: colors.muted, fontSize: "12px", lineHeight: "18px" }}>
              Sent via {siteName} — a self-hosted email platform.
              <br />
              You are receiving this because of activity in your workspace.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function CtaButton({
  buttonText,
  buttonUrl,
  brandColor,
  centered = false,
}: Pick<PresetValues, "buttonText" | "buttonUrl" | "brandColor"> & { centered?: boolean }) {
  if (!buttonText.trim()) return null;
  return (
    <Section style={{ textAlign: centered ? "center" : "left", padding: "8px 0 4px" }}>
      <Button
        href={buttonUrl}
        style={{
          backgroundColor: brandColor,
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "bold",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {buttonText}
      </Button>
    </Section>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ margin: "0 0 16px", color: colors.body, fontSize: "15px", lineHeight: "24px" }}>
      {children}
    </Text>
  );
}

/* ------------------------------ Preset 1 ------------------------------ */

export function SubmissionAlert({
  heading,
  body,
  buttonText,
  buttonUrl,
  brandColor = DEFAULT_BRAND,
  siteName,
  preview,
}: PresetProps) {
  return (
    <TemplateFrame preview={preview ?? heading} brandColor={brandColor} siteName={siteName}>
      <Text
        style={{
          margin: "0 0 16px",
          color: brandColor,
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}
      >
        NEW ACTIVITY
      </Text>
      <Heading style={{ margin: "0 0 16px", color: colors.heading, fontSize: "23px", lineHeight: "30px" }}>
        {heading}
      </Heading>
      <BodyText>{body}</BodyText>
      <CtaButton buttonText={buttonText} buttonUrl={buttonUrl} brandColor={brandColor} />
      <Text
        style={{
          margin: "20px 0 0",
          color: colors.muted,
          fontSize: "13px",
          lineHeight: "20px",
        }}
      >
        Submission details are stored safely in your workspace — nothing is lost if you miss this
        email.
      </Text>
    </TemplateFrame>
  );
}

/* ------------------------------ Preset 2 ------------------------------ */

export function WelcomeMessage({
  heading,
  body,
  buttonText,
  buttonUrl,
  brandColor = DEFAULT_BRAND,
  siteName,
  preview,
}: PresetProps) {
  return (
    <TemplateFrame preview={preview ?? heading} brandColor={brandColor} siteName={siteName}>
      <Section style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <Heading style={{ margin: "0 0 16px", color: colors.heading, fontSize: "26px", lineHeight: "34px" }}>
          {heading}
        </Heading>
        <Text style={{ margin: "0 0 16px", color: colors.body, fontSize: "15px", lineHeight: "24px" }}>
          {body}
        </Text>
        <Text style={{ margin: "0 0 8px", color: colors.body, fontSize: "15px", lineHeight: "24px" }}>
          If you have any questions, just reply to this email — we read everything.
        </Text>
        <CtaButton buttonText={buttonText} buttonUrl={buttonUrl} brandColor={brandColor} centered />
      </Section>
    </TemplateFrame>
  );
}

/* ------------------------------ Preset 3 ------------------------------ */

export function Announcement({
  heading,
  body,
  buttonText,
  buttonUrl,
  brandColor = DEFAULT_BRAND,
  siteName,
  preview,
}: PresetProps) {
  return (
    <TemplateFrame preview={preview ?? heading} brandColor={brandColor} siteName={siteName}>
      {/* accent tag — solid colors only (no alpha hex: fragile across clients) */}
      <Section
        style={{
          backgroundColor: colors.softBg,
          border: `1px solid ${colors.border}`,
          borderLeft: `3px solid ${brandColor}`,
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "24px",
        }}
      >
        <Text style={{ margin: 0, color: colors.body, fontSize: "13px" }}>
          <strong style={{ color: colors.heading }}>{siteName} update</strong>
        </Text>
      </Section>
      <Heading style={{ margin: "0 0 16px", color: colors.heading, fontSize: "23px", lineHeight: "30px" }}>
        {heading}
      </Heading>
      <BodyText>{body}</BodyText>
      <CtaButton buttonText={buttonText} buttonUrl={buttonUrl} brandColor={brandColor} />
    </TemplateFrame>
  );
}
