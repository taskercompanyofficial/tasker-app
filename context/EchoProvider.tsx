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
import { useAuthStore } from "@/context/auth-store";
import { createEcho } from "@/lib/echo";
import { router } from "expo-router";
import type Echo from "laravel-echo";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

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
  readonly onChatMessage: (cb: (event: any) => void) => () => void;
  readonly realtimeUnreadCount: number;
  readonly resetRealtimeUnread: () => void;
}

const EchoContext = createContext<EchoContextType>({
  isConnected: false,
  connectionState: "initialized",
  onNotification: () => () => {},
  onWorkOrderUpdate: () => () => {},
  onChatMessage: () => () => {},
  realtimeUnreadCount: 0,
  resetRealtimeUnread: () => {},
});

export function useEcho(): EchoContextType {
  return useContext(EchoContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function EchoProvider({ children }: PropsWithChildren) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const appMode = useAuthStore((state) => state.appMode);
  const realtimeMode =
    process.env.EXPO_PUBLIC_ENABLE_REALTIME ??
    process.env.NEXT_PUBLIC_ENABLE_REALTIME;
  const isRealtimeEnabled =
    realtimeMode != null
      ? realtimeMode === "true"
      : __DEV__;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("initialized");
  const [realtimeUnreadCount, setRealtimeUnreadCount] = useState(0);

  const echoRef = useRef<Echo<"reverb"> | null>(null);
  const lastConnectionStateRef = useRef<ConnectionState>("initialized");
  const pendingOfflineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const notificationCallbacksRef = useRef<Set<NotificationCallback>>(new Set());
  const workOrderCallbacksRef = useRef<Set<WorkOrderUpdateCallback>>(new Set());
  const chatCallbacksRef = useRef<Set<(event: any) => void>>(new Set());

  const applyConnectionState = useCallback((nextState: ConnectionState) => {
    if (nextState === "connecting") {
      if (lastConnectionStateRef.current === "connected") return;
      if (lastConnectionStateRef.current === "connecting") return;
    }

    if (nextState === lastConnectionStateRef.current) return;

    if (nextState === "connected" && pendingOfflineTimerRef.current) {
      clearTimeout(pendingOfflineTimerRef.current);
      pendingOfflineTimerRef.current = null;
    }

    if (
      (nextState === "disconnected" ||
        nextState === "failed" ||
        nextState === "unavailable") &&
      pendingOfflineTimerRef.current === null
    ) {
      pendingOfflineTimerRef.current = setTimeout(() => {
        lastConnectionStateRef.current = nextState;
        setConnectionState(nextState);
        setIsConnected(false);
        pendingOfflineTimerRef.current = null;
      }, 1200);
      return;
    }

    lastConnectionStateRef.current = nextState;
    setConnectionState(nextState);
    setIsConnected(nextState === "connected");
  }, []);

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

  const onChatMessage = useCallback(
    (cb: (event: any) => void): (() => void) => {
      chatCallbacksRef.current.add(cb);
      return () => {
        chatCallbacksRef.current.delete(cb);
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
    if (!isRealtimeEnabled) {
      if (pendingOfflineTimerRef.current) {
        clearTimeout(pendingOfflineTimerRef.current);
        pendingOfflineTimerRef.current = null;
      }
      if (echoRef.current) {
        echoRef.current.disconnect();
        echoRef.current = null;
      }
      lastConnectionStateRef.current = "disconnected";
      setIsConnected(false);
      setConnectionState("disconnected");
      return;
    }

    const userId = user?.id;

    if (!token || !userId) {
      if (pendingOfflineTimerRef.current) {
        clearTimeout(pendingOfflineTimerRef.current);
        pendingOfflineTimerRef.current = null;
      }
      if (echoRef.current) {
        console.log("[Echo] Disconnecting");
        echoRef.current.disconnect();
        echoRef.current = null;
      }
      lastConnectionStateRef.current = "disconnected";
      setIsConnected(false);
      setConnectionState("disconnected");
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
    applyConnectionState("connecting");

    const echo = createEcho(token);
    echoRef.current = echo;

    // @ts-ignore - for debugging
    if (global.Pusher) global.Pusher.logToConsole = __DEV__;

    const pusher = (echo as any).connector?.pusher;
    if (pusher?.connection) {
      pusher.connection.bind(
        "state_change",
        (states: { current: string; previous: string }) => {
          const state = states.current as ConnectionState;
          console.log(
            `[Echo] State change: ${states.previous} -> ${states.current}`,
          );
          applyConnectionState(state);
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
            const data = event.notification.data || {};
            const type = event.notification.type || data.type;

            // Navigate based on app mode and notification type
            if (appMode === 'customer') {
              if (type === 'chat') {
                if (data.chat_type === 'support') router.push('/customer/support-chat');
                else if (data.order_id) router.push(`/customer/order-chat/${data.order_id}`);
              } else {
                const orderRef = data.order_number || data.order_id || data.work_order_id;
                if (orderRef) {
                  router.push(`/customer/orders/${orderRef}`);
                } else {
                  router.push('/customer/notifications');
                }
              }
            } else {
              // Vendor / Staff App
              if (type === 'chat') {
                if (data.chat_type === 'support') router.push('/vendor/support-chat');
                else if (data.work_order_id) router.push(`/vendor/work-order-chat/${data.work_order_id}`);
              } else if (data.work_order_id || data.order_id) {
                const id = data.work_order_id || data.order_id;
                router.push(`/vendor/work-order-details/${id}`);
              } else {
                router.push('/vendor/notifications');
              }
            }
          },
        });

        // Dispatch to local page listeners
        notificationCallbacksRef.current.forEach((cb) => cb(event));
      })
      .listen(".message.created", (event: any) => {
        console.log(`[Echo] 💬 Message: ${event.message?.text}`);
        chatCallbacksRef.current.forEach((cb) => cb(event));
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
      if (pendingOfflineTimerRef.current) {
        clearTimeout(pendingOfflineTimerRef.current);
        pendingOfflineTimerRef.current = null;
      }
      echo.leave(privateChannelName);
      echo.leave("work-orders");
      echo.disconnect();
      echoRef.current = null;
      lastConnectionStateRef.current = "disconnected";
      setIsConnected(false);
      setConnectionState("disconnected");
    };
  }, [token, user?.id, appMode, applyConnectionState, isRealtimeEnabled]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      connectionState,
      onNotification,
      onWorkOrderUpdate,
      onChatMessage,
      realtimeUnreadCount,
      resetRealtimeUnread,
    }),
    [
      isConnected,
      connectionState,
      onNotification,
      onWorkOrderUpdate,
      onChatMessage,
      realtimeUnreadCount,
      resetRealtimeUnread,
    ],
  );

  return (
    <EchoContext.Provider value={contextValue}>
      {children}
    </EchoContext.Provider>
  );
}
