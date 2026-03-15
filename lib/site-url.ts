/**
 * Returns the correct site origin for email redirect URLs.
 *
 * - In production: reads NEXT_PUBLIC_SITE_URL  (set this in your Vercel env vars)
 * - In local dev:  falls back to http://localhost:3000
 *
 * Usage:  `${siteUrl()}/auth/callback`
 */
export function siteUrl(): string {
    if (typeof window !== "undefined") {
        // Client-side: use the actual browser origin (works for both dev & prod)
        return window.location.origin;
    }
    // Server-side: must be provided explicitly
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
