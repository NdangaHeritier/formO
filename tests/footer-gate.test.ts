import { describe, expect, it } from "vitest";
import { shouldShowFooter } from "@/components/Global/FooterGate";

describe("shouldShowFooter", () => {
  it("never shows the footer to a signed-in user", () => {
    for (const path of ["/", "/login", "/developer", "/developer/forms", "/f/thanks"]) {
      expect(shouldShowFooter(true, path)).toBe(false);
    }
  });

  it("shows the footer on public paths for guests", () => {
    for (const path of ["/", "/login", "/signup", "/signup/select-interest", "/f/thanks"]) {
      expect(shouldShowFooter(false, path)).toBe(true);
    }
  });

  it("hides the footer from guests inside the app", () => {
    for (const path of ["/developer", "/developer/projects", "/dashboard", "/api/health"]) {
      expect(shouldShowFooter(false, path)).toBe(false);
    }
  });

  it("does not treat path prefixes as matches for the homepage", () => {
    expect(shouldShowFooter(false, "/login-anything")).toBe(false);
  });
});
