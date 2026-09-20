import { describe, expect, it } from "vitest";
import { assertSafeExternalUrl } from "@/lib/security/safe-url";
describe("SSRF protection", () => { it("accepts public HTTPS URLs", () => expect(assertSafeExternalUrl("https://owasp.org/").hostname).toBe("owasp.org")); it("blocks local and metadata ranges", () => { expect(() => assertSafeExternalUrl("http://127.0.0.1/admin")).toThrow(); expect(() => assertSafeExternalUrl("http://169.254.169.254/latest")).toThrow(); }); });
