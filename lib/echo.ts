import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_URL } from "./api-endpoints";

/**
 * Robust constructor resolution for Hermes / Metro / React Native bundler.
 * Handles:
 * - Direct constructor functions
 * - CJS object { Pusher: Class }
 * - Babel/Webpack ESM wrappers { default: Class } or { default: { Pusher: Class } }
 */
export const getPusherConstructor = (mod: any = Pusher): any => {
  if (typeof mod === "function") return mod;
  if (mod?.Pusher && typeof mod.Pusher === "function") return mod.Pusher;
  if (mod?.default && typeof mod.default === "function") return mod.default;
  if (mod?.default?.Pusher && typeof mod.default.Pusher === "function") return mod.default.Pusher;
  if (mod?.default?.default && typeof mod.default.default === "function") return mod.default.default;
  return mod;
};

export const getEchoConstructor = (mod: any = Echo): any => {
  if (typeof mod === "function") return mod;
  if (mod?.default && typeof mod.default === "function") return mod.default;
  if (mod?.Echo && typeof mod.Echo === "function") return mod.Echo;
  if (mod?.default?.default && typeof mod.default.default === "function") return mod.default.default;
  return mod;
};

const PusherClass = getPusherConstructor();
const EchoClass = getEchoConstructor();

// Bind resolved Pusher class to globals so any internal Echo code can find it
if (typeof globalThis !== "undefined") {
  (globalThis as any).Pusher = PusherClass;
}
try {
  // @ts-ignore
  if (typeof global !== "undefined") {
    // @ts-ignore
    global.Pusher = PusherClass;
  }
} catch {}
try {
  // @ts-ignore
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.Pusher = PusherClass;
  }
} catch {}

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
  let apiHost = "api.taskercompany.cloud";
  try {
    apiHost = new URL(API_URL).hostname;
  } catch {
    apiHost = "api.taskercompany.cloud";
  }

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
  const host = envHost || apiHost || "api.taskercompany.cloud";
  const key = envKey || "nt9ptaliv3xdfx63werd";
  const fallbackPort = scheme === "https" ? 443 : 80;
  const parsedPort = envPort ? Number(envPort) : NaN;
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : fallbackPort;

  const pusherOptions = {
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
  };

  // Pre-create the Pusher client instance so Echo's connector doesn't have to resolve the constructor
  let client: any = null;
  try {
    client = new PusherClass(key, pusherOptions);
  } catch (err) {
    console.warn("[Echo] Direct Pusher instance creation fallback:", err);
  }

  return new EchoClass({
    broadcaster: "reverb",
    key,
    client: client || undefined,
    Pusher: PusherClass,
    ...pusherOptions,
  });
};
