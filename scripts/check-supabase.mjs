#!/usr/bin/env node
/**
 * Live check for the Supabase credentials in `.env`.
 *
 * Run with `npm run check:supabase`. The script never prints a full key; it only shows a masked
 * fingerprint. Exit code 0 means every configured check passed, 1 means at least one failed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TIMEOUT_MS = 10_000;
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Parses a dotenv-style file. Kept dependency-free because the project does not use dotenv. */
export function parseEnvFile(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.length > 1 && (value.startsWith('"') || value.startsWith("'")) && value.at(-1) === value[0]) {
      value = value.slice(1, -1);
    }
    if (key) values[key] = value;
  }
  return values;
}

/** Shows enough of a secret to recognize it without leaking it. */
export function maskSecret(value) {
  if (!value) return "(empty)";
  if (value.length <= 12) return `${"*".repeat(value.length)} (${value.length} chars)`;
  return `${value.slice(0, 8)}…${value.slice(-4)} (${value.length} chars)`;
}

/** Reads a Supabase JWT payload without verifying the signature; the API does the real check. */
export function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

/**
 * Classifies a Supabase API key. Supabase issues the same permission under two formats: the legacy
 * JWT (`eyJ...`, whose payload carries `role`/`ref`) and the newer opaque keys
 * (`sb_publishable_...`, `sb_secret_...`) that expose no readable claims, so they can only be
 * verified by calling the API. Returns null when the value is neither.
 */
export function classifyApiKey(value) {
  if (!value) return null;
  if (value.startsWith("sb_publishable_")) return { kind: "publishable", role: "anon", ref: null, exp: null };
  if (value.startsWith("sb_secret_")) return { kind: "secret", role: "service_role", ref: null, exp: null };
  const payload = decodeJwtPayload(value);
  if (!payload) return null;
  const base = { role: payload.role ?? null, ref: payload.ref ?? null, exp: payload.exp ?? null };
  if (payload.role === "anon") return { kind: "publishable", ...base };
  if (payload.role === "service_role") return { kind: "secret", ...base };
  return { kind: "unexpected", ...base };
}

/** Non-leaking one-line description of a classified key, for the report. */
export function describeApiKey(info, masked) {
  if (!info) return `${masked} — not a recognized Supabase key (expected eyJ…, sb_publishable_…, or sb_secret_…)`;
  if (info.kind === "publishable") {
    return info.ref
      ? `${masked} — anon JWT for project "${info.ref}"`
      : `${masked} — opaque publishable key (no readable claims; verified live below)`;
  }
  if (info.kind === "secret") {
    return info.ref
      ? `${masked} — service_role JWT for project "${info.ref}"`
      : `${masked} — opaque secret key (no readable claims; verified live below)`;
  }
  return `${masked} — unexpected JWT role "${info.role}"`;
}

/** Extracts the project ref from a `*.supabase.co` / `*.supabase.in` URL, or null otherwise. */
export function projectRefFromUrl(url) {
  try {
    const match = new URL(url).hostname.match(/^([a-z0-9-]+)\.supabase\.(co|in)$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Interprets a `GET /rest/v1/<table>` probe. A `401` means the key was rejected; `PGRST205` means
 * the key was accepted and only the table is missing, which is the expected state before the
 * migration is applied.
 */
export function classifyPostgrestProbe(status, body) {
  const code = body && typeof body === "object" ? body.code : undefined;
  if (status === 200) return { ok: true, detail: "key accepted and the table is reachable" };
  if (status === 401 || status === 403) {
    return { ok: false, detail: `key rejected by PostgREST (HTTP ${status}${code ? `, ${code}` : ""})` };
  }
  if (status === 404 || code === "PGRST205") {
    return { ok: true, detail: "key accepted; the table is missing, so the migration has not been applied" };
  }
  if (status >= 500) return { ok: false, detail: `Supabase returned HTTP ${status}` };
  return { ok: true, detail: `key accepted (HTTP ${status}${code ? `, ${code}` : ""})` };
}

/** Fetch wrapper that never throws on HTTP errors and always returns status + parsed body. */
async function request(url, init = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

/** Resolves the first of `keys` present in the process env, then in `.env`; returns its name too. */
function resolveCredential(keys, fileValues) {
  for (const key of keys) {
    const fromProcess = process.env[key]?.trim();
    if (fromProcess) return { name: key, value: fromProcess };
    const fromFile = (fileValues[key] ?? "").trim();
    if (fromFile) return { name: key, value: fromFile };
  }
  return { name: keys[0], value: "" };
}

async function checkAuthEndpoint(url, apiKey, label, endpointPath) {
  const { status, body } = await request(new URL(endpointPath, `${url}/`).href, {
    headers: { apikey: apiKey },
  });
  if (status === 200) return { label, status: "PASS", detail: `HTTP 200 from ${endpointPath}` };
  return { label, status: "FAIL", detail: `HTTP ${status} from ${endpointPath}: ${JSON.stringify(body).slice(0, 120)}` };
}

async function main() {
  let fileValues = {};
  let envFileLoaded = false;
  try {
    fileValues = parseEnvFile(readFileSync(path.join(PROJECT_ROOT, ".env"), "utf8"));
    envFileLoaded = true;
  } catch {
    // Fall through: the values may still come from the real environment.
  }

  const results = [];
  const urlEntry = resolveCredential(["NEXT_PUBLIC_SUPABASE_URL"], fileValues);
  const anonEntry = resolveCredential(
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
    fileValues,
  );
  const serviceEntry = resolveCredential(["SUPABASE_SERVICE_ROLE_KEY"], fileValues);
  const url = urlEntry.value;
  const anonKey = anonEntry.value;
  const serviceKey = serviceEntry.value;

  results.push({
    label: ".env file",
    status: envFileLoaded ? "PASS" : "SKIP",
    detail: envFileLoaded ? `${PROJECT_ROOT}${path.sep}.env parsed` : "not found; relying on process env",
  });

  results.push({
    label: "NEXT_PUBLIC_SUPABASE_URL",
    status: url ? "PASS" : "FAIL",
    detail: url
      ? `${url}${/\/rest\/v1\/?$/.test(url) ? " — WARNING: remove the /rest/v1 suffix" : ""}`
      : "missing, so the app runs in demo mode",
  });

  const urlRef = url ? projectRefFromUrl(url) : null;
  const anonInfo = classifyApiKey(anonKey);
  const publicKeyOk = anonInfo?.kind === "publishable";

  results.push({
    label: anonEntry.name,
    status: publicKeyOk ? "PASS" : "FAIL",
    detail: anonKey ? describeApiKey(anonInfo, maskSecret(anonKey)) : "missing, so the app runs in demo mode",
  });

  if (url && anonKey && publicKeyOk) {
    if (urlRef && anonInfo.ref && anonInfo.ref !== urlRef) {
      results.push({
        label: "key/project match",
        status: "FAIL",
        detail: `key belongs to project "${anonInfo.ref}" but URL is "${urlRef}"`,
      });
    } else if (anonInfo.exp && anonInfo.exp * 1000 < Date.now()) {
      results.push({ label: "key expiry", status: "FAIL", detail: "key is expired" });
    } else {
      results.push({
        label: "key/project match",
        status: "PASS",
        detail: anonInfo.ref
          ? `role "anon" on project "${urlRef ?? url}"`
          : `opaque key carries no project ref; the live probes below confirm it works against ${urlRef ?? url}`,
      });
    }

    results.push(await checkAuthEndpoint(url, anonKey, "Supabase Auth service", "auth/v1/health"));
    results.push(await checkAuthEndpoint(url, anonKey, "Auth settings via anon key", "auth/v1/settings"));

    const probe = await request(new URL("rest/v1/users?select=id&limit=1", `${url}/`).href, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    const probeResult = classifyPostgrestProbe(probe.status, probe.body);
    results.push({
      label: "REST probe via public key",
      status: probeResult.ok ? "PASS" : "FAIL",
      detail: probeResult.detail,
    });
  }

  if (serviceKey) {
    const serviceInfo = classifyApiKey(serviceKey);
    if (serviceInfo?.kind !== "secret") {
      results.push({
        label: serviceEntry.name,
        status: "FAIL",
        detail: describeApiKey(serviceInfo, maskSecret(serviceKey)),
      });
    } else if (urlRef && serviceInfo.ref && serviceInfo.ref !== urlRef) {
      results.push({
        label: serviceEntry.name,
        status: "FAIL",
        detail: `key belongs to project "${serviceInfo.ref}" but URL is "${urlRef}"`,
      });
    } else {
      const { status, body } = await request(new URL("rest/v1/users?select=id&limit=1", `${url}/`).href, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      const probeResult = classifyPostgrestProbe(status, body);
      results.push({
        label: serviceEntry.name,
        status: probeResult.ok ? "PASS" : "FAIL",
        detail: `${maskSecret(serviceKey)} — ${probeResult.detail}`,
      });
    }
  }

  const width = Math.max(...results.map((result) => result.label.length));
  console.log("\nSupabase credential check\n=========================");
  for (const result of results) {
    console.log(`${result.status.padEnd(4)}  ${result.label.padEnd(width)}  ${result.detail}`);
  }

  const failures = results.filter((result) => result.status === "FAIL");
  console.log(
    failures.length
      ? `\n${failures.length} check(s) failed. Get fresh values at Supabase dashboard → Project Settings → API Keys, then update .env and rerun npm run check:supabase.`
      : "\nAll checks passed.",
  );
  process.exitCode = failures.length ? 1 : 0;
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`check failed: ${error.message}`);
    process.exitCode = 1;
  });
}

