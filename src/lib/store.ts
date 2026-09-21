import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GeneratedDraft } from "@/lib/ai/provider";

export interface SavedDraft {
  id: string; // `${candidateId}:${style}`
  candidateId: string;
  style: string;
  candidateTitle: string;
  candidateUrl: string;
  source: string;
  draft: GeneratedDraft;
  createdAt: string;
}

interface StoreShape {
  drafts: Record<string, SavedDraft>;
}

const STORE_PATH = process.env.STORE_PATH
  ? path.resolve(process.env.STORE_PATH)
  : path.join(process.cwd(), "data", "store.json");
const MAX_DRAFTS = 200;

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoreShape;
    return { drafts: parsed.drafts ?? {} };
  } catch {
    return { drafts: {} };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function saveDraft(entry: SavedDraft): Promise<void> {
  const store = await readStore();
  store.drafts[entry.id] = entry;
  // Keep the store bounded: drop oldest drafts beyond the cap.
  const entries = Object.values(store.drafts).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  store.drafts = Object.fromEntries(entries.slice(0, MAX_DRAFTS).map((d) => [d.id, d]));
  await writeStore(store);
}

export async function listDrafts(): Promise<SavedDraft[]> {
  const store = await readStore();
  return Object.values(store.drafts).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteDraft(id: string): Promise<void> {
  const store = await readStore();
  delete store.drafts[id];
  await writeStore(store);
}
