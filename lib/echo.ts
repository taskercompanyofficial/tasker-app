import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_URL } from "./api-endpoints";

// laravel-echo expects Pusher to be on the global object
// @ts-ignore
global.Pusher = Pusher;

/**
 * Creates a fresh, authenticated Echo (Reverb/Pusher) instance.
 *
 * Reads connection config from EXPO_PUBLIC_REVERB_* env vars so the same
 * codebase works across local, staging, and production environments.
 *
 * ⚠️  Always call the returned instance's .disconnect() before creating
 *     a new one to avoid duplicate subscriptions.
 */
export const createEcho = (token: string): Echo<"reverb"> => {
  const apiHost = new URL(API_URL).hostname;
  const envScheme =
    process.env.EXPO_PUBLIC_REVERB_SCHEME ||
    process.env.NEXT_PUBLIC_REVERB_SCHEME;
  const envHost =
    process.env.EXPO_PUBLIC_REVERB_HOST ||
    process.env.NEXT_PUBLIC_REVERB_HOST;
  const envKey =
    process.env.EXPO_PUBLIC_REVERB_KEY ||
    process.env.EXPO_PUBLIC_REVERB_APP_KEY ||
    process.env.NEXT_PUBLIC_REVERB_KEY ||
    process.env.NEXT_PUBLIC_REVERB_APP_KEY;
  const envPort =
    process.env.EXPO_PUBLIC_REVERB_PORT ||
    process.env.NEXT_PUBLIC_REVERB_PORT;

  const scheme = (envScheme || "https").toLowerCase() === "http" ? "http" : "https";
  const host = envHost || apiHost;
  const key = envKey || "nt9ptaliv3xdfx63werd";
  const fallbackPort = scheme === "https" ? 443 : 80;
  const parsedPort = envPort ? Number(envPort) : NaN;
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : fallbackPort;

  return new Echo({
    broadcaster: "reverb",
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
};
