import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { assertSafeExternalUrl } from "@/lib/security/safe-url";

const MAX_HTML_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 3000;

/**
 * Fetches a public article URL and extracts its main text with Readability.
 * Returns null on any failure (blocked URL, non-HTML, paywall, timeout) so
 * callers can fall back to the candidate excerpt. Never throws.
 */
export async function extractArticleText(url: string): Promise<string | null> {
  try {
    assertSafeExternalUrl(url);
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      redirect: "follow",
      headers: { "User-Agent": "SignalPost/1.0 (+content-extraction)", Accept: "text/html" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return null;
    // Re-validate the final URL after redirects to close the SSRF redirect hole.
    if (res.url) assertSafeExternalUrl(res.url);
    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const text = article?.textContent?.replace(/\s+/g, " ").trim();
    return text ? text.slice(0, MAX_TEXT_CHARS) : null;
  } catch {
    return null;
  }
}
