import { useAuthStore } from "@/context/auth-store";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";

let Notifications: any = null;
try {
  if (Platform.OS !== "web") {
    Notifications = require("expo-notifications");
  }
} catch (e) {
  console.log("[DeepLink] Notifications module not available");
}

export function useNotificationDeepLink() {
  const appMode = useAuthStore((state) => state.appMode);

  const handleNotificationResponse = useCallback(
    (response: any) => {
      const data = response?.notification?.request?.content?.data || {};
      const type = data.type || data.notification_type;

      console.log("[DeepLink] Notification tapped:", { type, data, appMode });

      // Navigate based on app mode and notification type
      if (appMode === "customer") {
        handleCustomerNavigation(type, data);
      } else if (appMode === "vendor" || appMode === "vendor_staff") {
        handleVendorNavigation(type, data);
      }
    },
    [appMode]
  );

  const handleCustomerNavigation = (type: string, data: any) => {
    switch (type) {
      case "chat":
        if (data.chat_type === "support") {
          router.push("/customer/support-chat");
        } else if (data.order_id || data.work_order_id) {
          router.push(`/customer/order-chat/${data.order_id || data.work_order_id}`);
        }
        break;
      case "order":
      case "work_order":
      case "order_status":
      case "new_order":
      case "order_update":
        const orderRef = data.order_number || data.work_order_number || data.work_order_id || data.order_id || data.id;
        if (orderRef) {
          router.push(`/customer/orders/${orderRef}`);
        }
        break;
      default:
        router.push("/customer/notifications");
    }
  };

  const handleVendorNavigation = (type: string, data: any) => {
    switch (type) {
      case "chat":
        if (data.chat_type === "support") {
          router.push("/vendor/support-chat");
        } else if (data.work_order_id) {
          router.push(`/vendor/work-order-chat/${data.work_order_id}`);
        }
        break;
      case "work_order":
      case "order":
      case "new_assignment":
        const id = data.work_order_id || data.order_id;
        if (id) {
          router.push(`/vendor/work-order-details/${id}`);
        }
        break;
      case "billing_update":
      case "ledger_update":
        router.push("/vendor/(tabs)/earnings");
        break;
      default:
        router.push("/vendor/notifications");
    }
  };

  useEffect(() => {
    if (!Notifications?.addNotificationResponseReceivedListener) return;

    // Listen for notification taps (when app is in background/quit)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    if (Notifications?.getLastNotificationResponseAsync) {
      Notifications.getLastNotificationResponseAsync().then((response: any) => {
        if (response?.notification) {
          handleNotificationResponse(response);
        }
      }).catch(() => {});
    }

    return () => {
      subscription?.remove?.();
    };
  }, [handleNotificationResponse]);
}
