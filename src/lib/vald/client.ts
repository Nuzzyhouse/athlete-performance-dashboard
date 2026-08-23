/**
 * VALD ForceDecks API client. Swap this file (and mapping.ts) out entirely if you're on
 * a different force-plate provider — keep the shape (auth, list profiles, list recent
 * tests, list trial results) and nothing else in the sync pipeline needs to change.
 *
 * The client secret must never reach the browser — every function here is server-only.
 */

const AUTH_URL = "https://auth.prd.vald.com/oauth/token";

function region(): string {
  return process.env.VALD_TENANT_REGION || "use";
}

function serviceHost(service: "externaltenants" | "externalprofile" | "extforcedecks"): string {
  return `https://prd-${region()}-api-${service}.valdperformance.com`;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export function isValdConfigured(): boolean {
  return !!process.env.VALD_CLIENT_ID && !!process.env.VALD_CLIENT_SECRET;
}

async function getAccessToken(): Promise<string> {
  if (!isValdConfigured()) {
    throw new Error("VALD_CLIENT_ID / VALD_CLIENT_SECRET are not set.");
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.VALD_CLIENT_ID!,
      client_secret: process.env.VALD_CLIENT_SECRET!,
      audience: "vald-api-external",
    }),
  });

  if (!res.ok) {
    throw new Error(`VALD auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function valdFetch<T>(url: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`VALD request failed (${res.status}): ${url}`);
  }
  // The tests-pagination endpoint signals "no more pages" with a bodyless 204 —
  // calling .json() on that throws "Unexpected end of JSON input".
  if (res.status === 204) {
    return null as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export interface ValdTenant {
  id: string;
  name: string;
}

export async function getTenant(): Promise<ValdTenant> {
  const data = await valdFetch<{ tenants: ValdTenant[] } | null>(`${serviceHost("externaltenants")}/tenants`);
  const tenant = data?.tenants?.[0];
  if (!tenant) throw new Error("No VALD tenant found for this org.");
  return tenant;
}

export interface ValdProfile {
  profileId: string;
  givenName: string;
  familyName: string;
}

export async function getProfiles(tenantId: string): Promise<ValdProfile[]> {
  const data = await valdFetch<{ profiles: ValdProfile[] } | null>(
    `${serviceHost("externalprofile")}/profiles?tenantId=${encodeURIComponent(tenantId)}`,
  );
  return data?.profiles ?? [];
}

export interface ValdTest {
  testId: string;
  profileId: string;
  testType: string;
  modifiedDateUtc: string;
  recordedDateUtc: string;
}

/** Pages forward using modifiedDateUtc as a cursor until the API returns nothing new. */
export async function getRecentTests(tenantId: string, modifiedFromUtc: string): Promise<ValdTest[]> {
  const results: ValdTest[] = [];
  let cursor = modifiedFromUtc;

  // A multi-year initial backfill can span far more pages than a routine nightly
  // incremental sync ever would — cap generously rather than silently truncating.
  for (let page = 0; page < 500; page++) {
    const data = await valdFetch<{ tests: ValdTest[] } | null>(
      `${serviceHost("extforcedecks")}/tests?tenantId=${encodeURIComponent(tenantId)}&modifiedFromUtc=${encodeURIComponent(cursor)}`,
    );
    const tests = data?.tests ?? [];
    if (tests.length === 0) break;

    results.push(...tests);
    const last = tests[tests.length - 1];
    if (last.modifiedDateUtc === cursor) break;
    cursor = last.modifiedDateUtc;
  }

  return results;
}

export interface ValdTrialResult {
  limb: string;
  definition: { result: string };
  value: number;
}

export interface ValdTrial {
  results: ValdTrialResult[];
}

export async function getTrials(tenantId: string, testId: string): Promise<ValdTrial[]> {
  const data = await valdFetch<{ trials: ValdTrial[] } | null>(
    `${serviceHost("extforcedecks")}/v2019q3/teams/${encodeURIComponent(tenantId)}/tests/${encodeURIComponent(testId)}/trials`,
  );
  return data?.trials ?? [];
}
