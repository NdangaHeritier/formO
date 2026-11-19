import { describe, expect, it } from "vitest";
import { assertSmtpEndpoint, SmtpEndpointError, type Resolver } from "@/lib/smtp-guard";

const publicResolver: Resolver = async () => [{ address: "104.18.25.20", family: 4 }];
const privateResolver: Resolver = async () => [{ address: "10.1.2.3", family: 4 }];

describe("assertSmtpEndpoint", () => {
  it("allows a public literal host", async () => {
    await expect(assertSmtpEndpoint("smtp.example.com", 587, { resolver: publicResolver })).resolves.toBeUndefined();
  });

  it.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"])(
    "rejects private or special address %s",
    async (host) => {
      await expect(assertSmtpEndpoint(host, 587)).rejects.toBeInstanceOf(SmtpEndpointError);
    }
  );

  it("rejects a hostname resolving to a private IP", async () => {
    await expect(
      assertSmtpEndpoint("internal.example.com", 587, { resolver: privateResolver })
    ).rejects.toMatchObject({ message: "SMTP host is not allowed" });
  });

  it("rejects when any resolved address is private", async () => {
    const multi: Resolver = async () => [
      { address: "104.18.25.20", family: 4 },
      { address: "169.254.169.254", family: 4 },
    ];
    await expect(assertSmtpEndpoint("smtp.example.com", 587, { resolver: multi })).rejects.toBeInstanceOf(SmtpEndpointError);
  });

  it("allows loopback only with the explicit local flag", async () => {
    await expect(assertSmtpEndpoint("127.0.0.1", 1025)).rejects.toBeInstanceOf(SmtpEndpointError);
    await expect(
      assertSmtpEndpoint("127.0.0.1", 1025, { allowLocal: true })
    ).resolves.toBeUndefined();
  });

  it("rejects malformed hosts and ports", async () => {
    await expect(assertSmtpEndpoint("", 587)).rejects.toBeInstanceOf(SmtpEndpointError);
    await expect(assertSmtpEndpoint("bad\r\nhost", 587)).rejects.toBeInstanceOf(SmtpEndpointError);
    await expect(assertSmtpEndpoint("smtp.example.com", 0)).rejects.toBeInstanceOf(SmtpEndpointError);
    await expect(assertSmtpEndpoint("smtp.example.com", 70000)).rejects.toBeInstanceOf(SmtpEndpointError);
  });

  it("fails closed when DNS resolution fails", async () => {
    const failing: Resolver = async () => {
      throw new Error("ENOTFOUND");
    };
    await expect(
      assertSmtpEndpoint("smtp.example.com", 587, { resolver: failing })
    ).rejects.toMatchObject({ message: "SMTP host could not be resolved" });
  });
});
