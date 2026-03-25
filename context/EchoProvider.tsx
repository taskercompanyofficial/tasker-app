/**
 * EchoProvider — Tasker App
 *
 * Mirrors tc-chat's EchoProvider pattern exactly:
 *  • Single Echo instance stored in a ref (never recreated on re-render)
 *  • Pusher state_change / connected / error bindings for live status
 *  • Notification callbacks stored in a Set ref — zero re-render overhead
 *  • Full cleanup on unmount / logout
 *  • Integrated with expo-notifications for local feedback
 *
 * Channel strategy:
 *  vendor       → private-vendor.{id}
 *  vendor_staff → private-vendor-staff.{id}
 *  customer     → private-App.Models.User.{id}
 *  public       → work-orders
 */
import { useSession } from "@/context/ctx";
import { createEcho } from "@/lib/echo";
import type Echo from "laravel-echo";
import Toast from "react-native-toast-message";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

// Dynamic loading for OS notifications to prevent crashes in Expo Go SDK 53+
let Notifications: any = null;
try {
  if (Platform.OS !== "web") {
    Notifications = require("expo-notifications");
  }
} catch (e) {
  console.log("[Echo] Notifications module not available");
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RealtimeNotification {
  readonly id: number;
  readonly title: string;
  readonly message: string;
  readonly type: string;
  readonly data: Record<string, any> | null;
  readonly read: boolean;
  readonly created_at: string;
}

export interface NotificationEvent {
  readonly notification: RealtimeNotification;
}

export interface WorkOrderUpdateEvent {
  readonly workOrder: {
    id: number;
    status: string;
    work_order_number?: string;
    [key: string]: any;
  };
}

export type ConnectionState =
  | "initialized"
  | "connecting"
  | "connected"
  | "disconnected"
  | "unavailable"
  | "failed";

type NotificationCallback = (event: NotificationEvent) => void;
type WorkOrderUpdateCallback = (event: WorkOrderUpdateEvent) => void;

// ─── Context ──────────────────────────────────────────────────────────────────

interface EchoContextType {
  readonly isConnected: boolean;
  readonly connectionState: ConnectionState;
  readonly onNotification: (cb: NotificationCallback) => () => void;
  readonly onWorkOrderUpdate: (cb: WorkOrderUpdateCallback) => () => void;
  readonly realtimeUnreadCount: number;
  readonly resetRealtimeUnread: () => void;
}

const EchoContext = createContext<EchoContextType>({
  isConnected: false,
  connectionState: "initialized",
  onNotification: () => () => {},
  onWorkOrderUpdate: () => () => {},
  realtimeUnreadCount: 0,
  resetRealtimeUnread: () => {},
});

export function useEcho(): EchoContextType {
  return useContext(EchoContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function EchoProvider({ children }: PropsWithChildren) {
  const { session } = useSession();

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("initialized");
  const [realtimeUnreadCount, setRealtimeUnreadCount] = useState(0);

  const echoRef = useRef<Echo<"reverb"> | null>(null);
  const notificationCallbacksRef = useRef<Set<NotificationCallback>>(new Set());
  const workOrderCallbacksRef = useRef<Set<WorkOrderUpdateCallback>>(new Set());

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const onNotification = useCallback(
    (cb: NotificationCallback): (() => void) => {
      notificationCallbacksRef.current.add(cb);
      return () => {
        notificationCallbacksRef.current.delete(cb);
      };
    },
    [],
  );

  const onWorkOrderUpdate = useCallback(
    (cb: WorkOrderUpdateCallback): (() => void) => {
      workOrderCallbacksRef.current.add(cb);
      return () => {
        workOrderCallbacksRef.current.delete(cb);
      };
    },
    [],
  );

  const resetRealtimeUnread = useCallback(() => {
    setRealtimeUnreadCount(0);
  }, []);

  // ── Permissions ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === "web" || !Notifications) return;
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.log("[Echo] Push permission denied");
          return;
        }
      } catch (e) {
        console.warn("[Echo] Permission check failed:", e);
      }
    }
    requestPermissions();
  }, []);

  // ── Echo lifecycle ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = session.token;
    const userId = session.user?.id;
    const appMode = session.appMode;

    if (!token || !userId) {
      if (echoRef.current) {
        console.log("[Echo] Disconnecting");
        echoRef.current.disconnect();
        echoRef.current = null;
        setIsConnected(false);
        setConnectionState("disconnected");
      }
      return;
    }

    if (echoRef.current) return;

    const privateChannelName =
      appMode === "vendor"
        ? `vendor.${userId}`
        : appMode === "vendor_staff"
          ? `vendor-staff.${userId}`
          : `customer.${userId}`;

    console.log(`[Echo] Connecting to ${privateChannelName}...`);
    setConnectionState("connecting");

    const echo = createEcho(token);
    echoRef.current = echo;

    // @ts-ignore - for debugging
    if (global.Pusher) global.Pusher.logToConsole = true;

    const pusher = (echo as any).connector?.pusher;
    if (pusher?.connection) {
      pusher.connection.bind(
        "state_change",
        (states: { current: string; previous: string }) => {
          const state = states.current as ConnectionState;
          console.log(
            `[Echo] State change: ${states.previous} -> ${states.current}`,
          );
          setConnectionState(state);
          setIsConnected(state === "connected");
        },
      );

      pusher.connection.bind("error", (err: any) => {
        console.error("[Echo] Pusher error:", err);
      });
    }

    // Sub to Private Channel (Notifications)
    echo
      .private(privateChannelName)
      .listen(".notification.created", (event: NotificationEvent) => {
        console.log(`[Echo] 🔔 Notification: ${event.notification?.title}`);

        // Increment UI badge
        setRealtimeUnreadCount((c) => c + 1);

        // Show local notification (OS Popup) - Safe check for Expo Go
        try {
          if (Platform.OS !== "web") {
            Notifications.scheduleNotificationAsync({
              content: {
                title: event.notification.title,
                body: event.notification.message,
                data: event.notification.data || {},
              },
              trigger: null,
            });
          }
        } catch (err) {
          console.warn("[Echo] OS Notification scheduling skipped:", err);
        }

        // Show In-App Toast
        Toast.show({
          type: "success",
          text1: event.notification.title,
          text2: event.notification.message,
          onPress: () => {
            // Possible navigation logic here
          },
        });

        // Dispatch to local page listeners
        notificationCallbacksRef.current.forEach((cb) => cb(event));
      });

    // Sub to Public Channel (Work Orders)
    echo
      .channel("work-orders")
      .listen(".work-order.updated", (event: WorkOrderUpdateEvent) => {
        const woNum =
          event.workOrder.work_order_number || `#${event.workOrder.id}`;
        console.log(`[Echo] 📦 Work Order updated: ${woNum}`);

        Toast.show({
          type: "info",
          text1: "Job Updated",
          text2: `Work Order ${woNum} has been updated.`,
        });

        workOrderCallbacksRef.current.forEach((cb) => cb(event));
      });

    return () => {
      console.log("[Echo] Cleanup on logout/unmount");
      echo.leave(privateChannelName);
      echo.leave("work-orders");
      echo.disconnect();
      echoRef.current = null;
      setIsConnected(false);
      setConnectionState("disconnected");
    };
  }, [session.token, session.user?.id, session.appMode]);

  return (
    <EchoContext.Provider
      value={{
        isConnected,
        connectionState,
        onNotification,
        onWorkOrderUpdate,
        realtimeUnreadCount,
        resetRealtimeUnread,
      }}
    >
      {children}
    </EchoContext.Provider>
  );
}
