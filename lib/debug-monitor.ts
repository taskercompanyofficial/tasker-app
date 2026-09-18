import { APP_LOGS_INGEST_URL } from "@/lib/api-endpoints";
import { useAuthStore } from "@/context/auth-store";

type DebugPayload = Record<string, unknown>;

export type DebugLogItem = {
  id: string;
  ts: string;
  event: string;
  payload?: DebugPayload;
};

const MAX_LOGS = 300;
let logs: DebugLogItem[] = [];
const listeners = new Set<(items: DebugLogItem[]) => void>();
let remoteLogInitDone = false;

const isPrcodDebugEnabled = process.env.EXPO_PUBLIC_ENABLE_APP_DEBUG === "1";
export const isDebugMonitorEnabled = __DEV__ || isPrcodDebugEnabled;

const emit = () => {
  const snapshot = [...logs];
  listeners.forEach((listener) => listener(snapshot));
};

const stringifyArg = (value: unknown): string => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const sendRemoteLog = async (event: string, payload?: DebugPayload, level: string = "info") => {
  try {
    const session = useAuthStore.getState();
    const { default: myAxios } = await import("@/lib/axios.config");
    await myAxios.post(APP_LOGS_INGEST_URL, {
      event,
      level,
      channel: "mobile-app",
      message: event,
      app: "tasker",
      mode: session.appMode,
      platform: "mobile",
      payload,
    });
  } catch {
    // Prevent logging failures from affecting app runtime.
  }
};

export function addDebugLog(event: string, payload?: DebugPayload) {
  const basePayload = {
    ts: new Date().toISOString(),
    ...payload,
  };

  if (isDebugMonitorEnabled) {
    const entry: DebugLogItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: basePayload.ts,
      event,
      payload,
    };
    logs = [entry, ...logs].slice(0, MAX_LOGS);
    emit();
  }

  sendRemoteLog(event, basePayload, "info");
}

export function initRemoteLogging() {
  if (remoteLogInitDone) return;
  remoteLogInitDone = true;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args: unknown[]) => {
    sendRemoteLog("console_error", { args: args.map(stringifyArg) }, "error");
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    sendRemoteLog("console_warn", { args: args.map(stringifyArg) }, "warning");
    originalWarn(...args);
  };

  const globalScope = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
      setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
    };
  };

  const existingHandler = globalScope.ErrorUtils?.getGlobalHandler?.();
  globalScope.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    sendRemoteLog(
      "uncaught_exception",
      {
        isFatal: !!isFatal,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      "critical",
    );
    existingHandler?.(error, isFatal);
  });
}

export function subscribeDebugLogs(listener: (items: DebugLogItem[]) => void) {
  listeners.add(listener);
  listener([...logs]);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDebugLogs() {
  logs = [];
  emit();
}
