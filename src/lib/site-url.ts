/**
 * Canonical site URL — single source of truth.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL   (set this in Vercel env vars for full control)
 *  2. VERCEL_PROJECT_PRODUCTION_URL (auto-provided by Vercel for the prod domain)
 *  3. localhost fallback for local dev
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export const siteUrl = getSiteUrl();
