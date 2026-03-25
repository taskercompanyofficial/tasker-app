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
  const scheme = process.env.EXPO_PUBLIC_REVERB_SCHEME ?? "https";
  const port = process.env.EXPO_PUBLIC_REVERB_PORT
    ? parseInt(process.env.EXPO_PUBLIC_REVERB_PORT, 10)
    : 443;

  return new Echo({
    broadcaster: "reverb",
    key: process.env.EXPO_PUBLIC_REVERB_APP_KEY || "nt9ptaliv3xdfx63werd",
    wsHost: process.env.EXPO_PUBLIC_REVERB_HOST || "api.taskercompany.cloud",
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
