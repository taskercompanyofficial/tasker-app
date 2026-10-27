import { BACKEND_URL } from "./api-endpoints";

/**
 * Normalizes any image path or URL into a production-safe, ATS-compliant HTTPS URL.
 * Handles:
 * - Upgrading http:// to https:// (prevents iOS App Transport Security from dropping requests)
 * - Mapping localhost/127.0.0.1 to production BACKEND_URL
 * - Relative Laravel storage paths ('storage/...', '/storage/...', 'avatars/...', etc.)
 * - Local file, data, and blob URIs
 * - Null / undefined / stringified falsy values
 */
export default function getImageUrl(image?: string | null): string {
  if (!image || typeof image !== "string") return "";

  const trimmed = image.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "[object Object]"
  ) {
    return "";
  }

  // Local file URIs, base64 data URIs, or Photos library URIs
  if (
    trimmed.startsWith("file://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("ph://")
  ) {
    return trimmed;
  }

  // Handle localhost / 127.0.0.1 / 10.0.2.2 saved during local testing
  if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?/i.test(trimmed)) {
    const path = trimmed.replace(/^https?:\/\/[^/]+/i, "");
    return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  }

  // Full URL: upgrade HTTP to HTTPS for iOS App Transport Security (ATS) compliance
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  // Clean leading slash for consistency
  const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;

  // RustFS daily selfies served via public /images/daily-selfies/{date}/{filename} route
  const dailySelfieMatch = cleanPath.match(
    /^(?:storage\/)?vendors\/daily-selfies\/([0-9\-]+)\/([^/]+)$/
  );
  if (dailySelfieMatch) {
    return `${BACKEND_URL}/images/daily-selfies/${dailySelfieMatch[1]}/${dailySelfieMatch[2]}`;
  }

  // Already prefixed with storage/
  if (cleanPath.startsWith("storage/")) {
    return `${BACKEND_URL}/${cleanPath}`;
  }

  // Default Laravel public storage folder
  return `${BACKEND_URL}/storage/${cleanPath}`;
}
