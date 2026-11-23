import { describe, expect, it } from "vitest";
import { headerConfig } from "../src/components/Header/config";

const allHrefs = (audience: keyof typeof headerConfig) => {
  const config = headerConfig[audience];
  return [
    ...config.workspaceLinks.map((link) => link.href),
    ...config.ctas.map((cta) => cta.href),
    config.accountSettingsHref ?? "",
  ].filter(Boolean);
};

describe("header audience configuration", () => {
  it("never exposes developer destinations to non-developers", () => {
    const hrefs = allHrefs("nonDeveloper");
    expect(hrefs.some((href) => href.startsWith("/developer"))).toBe(false);
    expect(headerConfig.nonDeveloper.accountSettingsHref).toBe("/non-dev/account");
  });

  it("never exposes non-developer destinations to developers", () => {
    const hrefs = allHrefs("developer");
    expect(hrefs.some((href) => href.startsWith("/non-dev"))).toBe(false);
    expect(headerConfig.developer.accountSettingsHref).toBe("/developer/account");
  });

  it("keeps the public header audience-neutral", () => {
    const hrefs = allHrefs("public");
    expect(hrefs.some((href) => href.startsWith("/developer"))).toBe(false);
    expect(hrefs.some((href) => href.startsWith("/non-dev"))).toBe(false);
  });

  it("only permits the admin-only link in the developer config", () => {
    expect(
      headerConfig.developer.workspaceLinks.some((link) => link.adminOnly)
    ).toBe(true);
    expect(
      headerConfig.nonDeveloper.workspaceLinks.some((link) => link.adminOnly)
    ).toBe(false);
  });
});
