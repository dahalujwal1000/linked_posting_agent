import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

process.env.STORE_PATH = path.join(mkdtempSync(path.join(tmpdir(), "signalpost-")), "store.json");

const { saveDraft, listDrafts, deleteDraft } = await import("@/lib/store");

function fakeDraft(id: string) {
  return {
    id,
    candidateId: "cand1",
    style: "educational",
    candidateTitle: "A title",
    candidateUrl: "https://example.com/a",
    source: "example",
    draft: {
      title: "Draft title here",
      content: "A".repeat(100),
      version: "educational" as const,
      sourceClaims: [],
    },
    createdAt: new Date().toISOString(),
  };
}

describe("local draft store", () => {
  it("saves, lists, and deletes drafts", async () => {
    await saveDraft(fakeDraft("a:educational"));
    await saveDraft(fakeDraft("a:opinion"));

    let drafts = await listDrafts();
    expect(drafts.map((d) => d.id).sort()).toEqual(["a:educational", "a:opinion"]);

    // Saving the same id replaces rather than duplicates.
    await saveDraft(fakeDraft("a:educational"));
    drafts = await listDrafts();
    expect(drafts).toHaveLength(2);

    await deleteDraft("a:educational");
    drafts = await listDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe("a:opinion");
  });
});
