import { describe, expect, it } from "vitest";
import {
  classifyApiKey,
  classifyPostgrestProbe,
  decodeJwtPayload,
  describeApiKey,
  maskSecret,
  parseEnvFile,
  projectRefFromUrl,
} from "../../scripts/check-supabase.mjs";

function fakeJwt(claims) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(claims)}.signature`;
}

describe("Supabase credential helpers", () => {
  it("parses dotenv files with comments and quoted values", () => {
    const parsed = parseEnvFile('# comment\nNEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co\nAPP_URL="http://localhost:3000"\nBAD_LINE');
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe("https://demo.supabase.co");
    expect(parsed.APP_URL).toBe("http://localhost:3000");
  });

  it("masks secrets without leaking them", () => {
    const masked = maskSecret("abcdefghijklmnopqrstuvwxyz");
    expect(masked.startsWith("abcdefgh")).toBe(true);
    expect(masked).not.toContain("ijklmnop");
    expect(maskSecret("")).toContain("empty");
  });

  it("decodes Supabase JWT payloads", () => {
    const payload = decodeJwtPayload(fakeJwt({ role: "anon", ref: "demo", exp: 1_800_000_000 }));
    expect(payload.role).toBe("anon");
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });

  it("extracts project refs from Supabase URLs", () => {
    expect(projectRefFromUrl("https://demo-ref-abcdefghijklmno.supabase.co")).toBe("demo-ref-abcdefghijklmno");
    expect(projectRefFromUrl("https://example.com")).toBeNull();
    expect(projectRefFromUrl("nope")).toBeNull();
  });

  it("classifies PostgREST probe responses", () => {
    expect(classifyPostgrestProbe(200, {}).ok).toBe(true);
    expect(classifyPostgrestProbe(401, { code: "42501" }).ok).toBe(false);
    expect(classifyPostgrestProbe(404, { code: "PGRST205" }).ok).toBe(true);
    expect(classifyPostgrestProbe(500, {}).ok).toBe(false);
  });

  it("classifies both legacy JWT and new opaque keys", () => {
    expect(classifyApiKey(fakeJwt({ role: "anon", ref: "zing", exp: 1_800_000_000 }))).toMatchObject({
      kind: "publishable",
      role: "anon",
      ref: "zing",
    });
    expect(classifyApiKey(fakeJwt({ role: "service_role", ref: "zing" }))).toMatchObject({
      kind: "secret",
      ref: "zing",
    });
    expect(classifyApiKey("sb_publishable_demo0000000000000000000000")).toMatchObject({
      kind: "publishable",
      role: "anon",
      ref: null,
    });
    expect(classifyApiKey("sb_secret_abcdefghijklmnopqrstuvwxyz")).toMatchObject({
      kind: "secret",
      role: "service_role",
      ref: null,
    });
  });

  it("rejects a JWT whose role is neither anon nor service_role", () => {
    expect(classifyApiKey(fakeJwt({ role: "authenticated" }))).toMatchObject({ kind: "unexpected" });
    expect(classifyApiKey("not-a-key")).toBeNull();
    expect(classifyApiKey("")).toBeNull();
  });

  it("describes keys without leaking them", () => {
    const opaque = describeApiKey(classifyApiKey("sb_publishable_demo0000000000000000000000"), "sb_publi…0000 (46 chars)");
    expect(opaque).toContain("opaque publishable key");
    expect(opaque).not.toContain("demo000000000000000000");
    expect(describeApiKey(classifyApiKey(fakeJwt({ role: "anon", ref: "zing" })), "masked")).toContain('anon JWT for project "zing"');
    expect(describeApiKey(null, "masked")).toContain("not a recognized Supabase key");
  });
});