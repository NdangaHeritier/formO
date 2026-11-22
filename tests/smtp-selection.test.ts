import { describe, expect, it } from "vitest";
import { selectDeliverySender } from "../src/server/services/smtp-selection";

describe("sender selection", () => {
  const formSender = { id: "form-sender", fromEmail: "form@example.com" };
  const workspaceDefault = { id: "workspace-default", fromEmail: "workspace@example.com" };

  it("prefers the form-specific sender", () => {
    expect(selectDeliverySender(formSender, workspaceDefault)).toEqual(formSender);
  });

  it("falls back to the workspace default when the form has no sender", () => {
    expect(selectDeliverySender(null, workspaceDefault)).toEqual(workspaceDefault);
  });

  it("falls back to system SMTP when neither is configured", () => {
    expect(selectDeliverySender(null, null)).toBeNull();
    expect(selectDeliverySender(undefined, undefined)).toBeNull();
  });
});
