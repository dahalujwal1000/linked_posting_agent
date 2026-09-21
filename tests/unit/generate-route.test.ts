import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.GEMINI_MODEL = "gemini-3.5-flash";
process.env.STORE_PATH = path.join(mkdtempSync(path.join(tmpdir(), "signalpost-")), "store.json");

const validDraft = {
  title: "A grounded take on the story",
  content: "A useful, source-grounded observation with enough detail to pass structured draft validation and invite a professional discussion from readers.",
  version: "opinion",
  sourceClaims: [{ claim: "the sky is blue", evidence: "source says so" }],
};

vi.stubGlobal("fetch", async (input: unknown) => {
  const url = String(input);
  if (url.includes("generativelanguage")) {
    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(validDraft) }] } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  // Article extraction fetch fails → route falls back to the excerpt.
  return new Response("not found", { status: 404 });
});

const { POST } = await import("@/app/api/generate/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate", () => {
  it("rejects an invalid body with 400", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns a validated draft for a valid request", async () => {
    const res = await POST(makeRequest({
      candidateId: "abc123",
      title: "A news item worth posting about",
      url: "https://dev.to/some-article",
      source: "dev.to",
      excerpt: "Something happened in tech.",
      topic: "Cybersecurity",
      style: "opinion",
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.draft.version).toBe("opinion");
    expect(data.draft.sourceClaims).toHaveLength(1);
    expect(data.saved.id).toBe("abc123:opinion");
    expect(data.usedArticleText).toBe(false);
    expect(data.log[0]).toMatchObject({ provider: "gemini", attempt: 0 });
  });
});
