import { describe, expect, it } from "vitest";
import { createNicNacStaticTextStreamResponse } from "../../lib/nic-nac/core/static-stream";

describe("Finder Nic-Nac static stream response", () => {
  it("emits a UI message stream with a single text response", async () => {
    const response = createNicNacStaticTextStreamResponse({
      message: "I can help with Sparkle Finder work.",
      messageId: "assistant-1",
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain('"type":"start"');
    expect(body).toContain('"messageId":"assistant-1"');
    expect(body).toContain('"type":"text-start"');
    expect(body).toContain('"id":"text-1"');
    expect(body).toContain('"type":"text-delta"');
    expect(body).toContain('"delta":"I can help with Sparkle Finder work."');
    expect(body).toContain('"type":"text-end"');
    expect(body).toContain("data: [DONE]");
  });
});
