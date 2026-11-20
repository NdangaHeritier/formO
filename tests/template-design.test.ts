import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseTemplateDesign, templateDesignSchema } from "../src/lib/template-design";

const validDesign = {
  presetId: "welcome-message",
  heading: "Welcome",
  body: "Thanks for joining.",
  buttonText: "Start",
  buttonUrl: "https://app.example.com/start",
  brandColor: "#ca8a04",
};

test("preset customization data round-trips through the template schema", () => {
  assert.deepEqual(parseTemplateDesign(validDesign), templateDesignSchema.parse(validDesign));
});

test("unsafe template action URLs are rejected", () => {
  assert.throws(
    () => templateDesignSchema.parse({ ...validDesign, buttonUrl: "javascript:alert(1)" }),
    /Button URL/
  );
});

test("malformed brand colors are rejected", () => {
  assert.throws(
    () => templateDesignSchema.parse({ ...validDesign, brandColor: "red" }),
    /Invalid brand color/
  );
});

test("legacy HTML-only templates fall back to the HTML source editor", () => {
  assert.equal(parseTemplateDesign(null), null);
  assert.equal(parseTemplateDesign({ presetId: "old-template" }), null);
});
