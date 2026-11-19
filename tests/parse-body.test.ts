import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { HttpError } from "@/server/auth/authorization";
import { parseSubmissionBody } from "@/server/submissions/parse-body";

function req(body: BodyInit | null, contentType: string, extra: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/f/fmo_test", {
    method: "POST",
    headers: { "content-type": contentType, ...extra },
    body,
  });
}

async function expectStatus(promise: Promise<unknown>, status: number) {
  await expect(promise).rejects.toMatchObject({ status });
}

describe("parseSubmissionBody", () => {
  it("parses JSON fields and reports wasJson", async () => {
    const result = await parseSubmissionBody(
      req(JSON.stringify({ name: "Ada", email: "a@b.test" }), "application/json"),
      65_536,
      "_gotcha"
    );
    expect(result.data).toEqual({ name: "Ada", email: "a@b.test" });
    expect(result.wasJson).toBe(true);
    expect(result.fileParts).toBe(0);
  });

  it("parses urlencoded bodies", async () => {
    const result = await parseSubmissionBody(req("a=1&b=2", "application/x-www-form-urlencoded"), 65_536, null);
    expect(result.data).toEqual({ a: "1", b: "2" });
    expect(result.wasJson).toBe(false);
  });

  it("rejects unsupported content types with 415", async () => {
    await expectStatus(
      parseSubmissionBody(req("hello", "text/plain"), 65_536, null),
      415
    );
  });

  it("rejects a declared oversized Content-Length with 413 before reading", async () => {
    await expectStatus(
      parseSubmissionBody(req("{}", "application/json", { "content-length": "999999" }), 100, null),
      413
    );
  });

  it("rejects a stream that crosses the byte cap with 413", async () => {
    await expectStatus(
      parseSubmissionBody(req(JSON.stringify({ a: "x".repeat(500) }), "application/json"), 100, null),
      413
    );
  });

  it("rejects malformed JSON with 400", async () => {
    await expectStatus(parseSubmissionBody(req("{bad", "application/json"), 65_536, null), 400);
  });

  it("rejects more than 100 fields with 422", async () => {
    const payload: Record<string, string> = {};
    for (let i = 0; i < 101; i += 1) payload[`f${i}`] = "v";
    await expectStatus(
      parseSubmissionBody(req(JSON.stringify(payload), "application/json"), 65_536, null),
      422
    );
  });

  it("rejects long keys and long values with 422", async () => {
    await expectStatus(
      parseSubmissionBody(req(JSON.stringify({ ["k".repeat(101)]: "v" }), "application/json"), 65_536, null),
      422
    );
    await expectStatus(
      parseSubmissionBody(req(JSON.stringify({ a: "v".repeat(10_001) }), "application/json"), 65_536, null),
      422
    );
  });

  it("rejects nesting deeper than three levels with 422", async () => {
    await expectStatus(
      parseSubmissionBody(req(JSON.stringify({ a: { b: { c: { d: "deep" } } } }), "application/json"), 65_536, null),
      422
    );
  });

  it("flattens allowed nested values to strings", async () => {
    const result = await parseSubmissionBody(
      req(JSON.stringify({ a: { b: "c" } }), "application/json"),
      65_536,
      null
    );
    expect(result.data.a).toBe('{"b":"c"}');
  });

  it("extracts reserved fields and removes them from stored data", async () => {
    const result = await parseSubmissionBody(
      req(
        JSON.stringify({
          name: "Ada",
          _gotcha: "bot",
          _redirect: "https://site.test/done",
          _subject: "Custom",
          "cf-turnstile-response": "token",
        }),
        "application/json"
      ),
      65_536,
      "_gotcha"
    );
    expect(result.data).toEqual({ name: "Ada" });
    expect(result.reserved).toEqual({
      honeypot: "bot",
      redirect: "https://site.test/done",
      subject: "Custom",
      turnstile: "token",
    });
  });

  it("drops prototype-pollution keys", async () => {
    const result = await parseSubmissionBody(
      req('{"__proto__":{"polluted":true},"name":"Ada"}', "application/json"),
      65_536,
      null
    );
    expect(result.data).toEqual({ name: "Ada" });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("parses multipart text fields and counts file parts", async () => {
    const form = new FormData();
    form.set("name", "Ada");
    form.set("file", new Blob(["binary"], { type: "application/octet-stream" }), "a.bin");
    const result = await parseSubmissionBody(
      new NextRequest("http://localhost/api/f/fmo_test", { method: "POST", body: form }),
      65_536,
      null
    );
    expect(result.fileParts).toBeGreaterThan(0);
  });

  it("surfaces HttpError with the expected status class", async () => {
    const error = await parseSubmissionBody(req("x", "text/plain"), 65_536, null).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
  });
});
