import Splash from "@/components/splash";
import DebugPanel from "@/components/common/DebugPanel";
import { useAuthStore } from "@/context/auth-store";
import { EchoProvider } from "@/context/EchoProvider";
import { addDebugLog, initRemoteLogging } from "@/lib/debug-monitor";
import { Stack, usePathname, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import Colors from "@/constants/Colors";
import React, { useEffect, useRef } from "react";
import AlertModal from "@/components/common/AlertModal";
import OTAUpdateManager from "@/components/common/OTAUpdateManager";
import NetworkStatus from "@/components/NetworkStatus";
import { useNotificationDeepLink } from "@/hooks/use-notification-deep-link";
import * as Linking from "expo-linking";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoading = useAuthStore((state) => state.isLoading);
  const appMode = useAuthStore((state) => state.appMode);
  const shouldUseEcho = appMode !== "vendor" && appMode !== "vendor_staff";
  const renderCountRef = useRef(0);
  const lastRenderDebugAtRef = useRef(0);

  renderCountRef.current += 1;

  useEffect(() => {
    initRemoteLogging();
    // Wait for auth-store persistence to finish rehydrating from AsyncStorage,
    // THEN call initialize() — all from within React's lifecycle so
    // store mutations don't cause useSyncExternalStore tearing.
    const runInit = () => {
      useAuthStore.getState().initialize();
    };

    if (useAuthStore.persist.hasHydrated()) {
      // Already hydrated (e.g. on hot-reload)
      runInit();
    } else {
      // Subscribe to hydration completion
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        unsub();
        runInit();
      });
    }
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (now - lastRenderDebugAtRef.current < 700) return;

    lastRenderDebugAtRef.current = now;
    const state = useAuthStore.getState();
    addDebugLog("root_render", {
      count: renderCountRef.current,
      isLoading,
      appMode,
      hasToken: !!state.token,
      hasCustomerToken: !!state.customerToken,
      hasVendorToken: !!state.vendorToken,
      hasVendorStaffToken: !!state.vendorStaffToken,
      shouldUseEcho,
      path: pathname,
    });
  }, [isLoading, appMode, shouldUseEcho, pathname]);

  useEffect(() => {
    const state = useAuthStore.getState();
    addDebugLog("auth_state_changed", {
      isLoading,
      appMode,
      hasToken: !!state.token,
      hasUser: !!state.user,
      path: pathname,
    });
  }, [isLoading, appMode, pathname]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(Colors.neutral.white);
    if (__DEV__) {
      try {
        const KeepAwake = require("expo-keep-awake");
        if (KeepAwake && KeepAwake.activateKeepAwakeAsync) {
          void KeepAwake.activateKeepAwakeAsync();
        }
        return () => {
          if (KeepAwake && KeepAwake.deactivateKeepAwakeAsync) {
            void KeepAwake.deactivateKeepAwakeAsync();
          }
        };
      } catch (err) {
        console.warn("expo-keep-awake failed to initialize:", err);
      }
    }
  }, []);

  // Handle deep links from website - Unified route matching
  useEffect(() => {
    if (isLoading) return;

    const handleDeepLink = (url: string) => {
      console.log("[DeepLink] Received URL:", url);
      const { path, queryParams } = Linking.parse(url);
      console.log("[DeepLink] Path:", path, "Params:", queryParams);

      const state = useAuthStore.getState();
      const activeMode = state.appMode;
      const hasActiveSession = !!state.token;

      // Deep-link map below is customer-centric. Avoid hijacking vendor/staff sessions.
      if (hasActiveSession && activeMode && activeMode !== "customer") {
        return;
      }

      if (!path) return;

      const customerToken = useAuthStore.getState().customerToken;
      const isAuthRoute = (targetPath: string) => {
        if (customerToken) {
          router.push(targetPath as any);
        } else {
          router.push({
            pathname: "/auth/customer/sign-in",
            params: { redirect: targetPath },
          });
        }
      };

      // ==================== ORDERS ROUTES ====================
      // Website: /orders/{number} -> App: /customer/orders/{number}
      // Website: /track?order={number} -> App: /customer/orders/{number}
      if (path.includes("orders/")) {
        const orderNumber = path.split("orders/")[1]?.split("/")[0];
        if (orderNumber) {
          isAuthRoute(`/customer/orders/${orderNumber}`);
          return;
        }
      }

      // Handle /track?order=XXX query param
      if (path === "track" || path === "/track") {
        const orderNumber = queryParams?.order || queryParams?.orderNumber;
        if (orderNumber) {
          isAuthRoute(`/customer/orders/${orderNumber}`);
          return;
        }
        // If no order number, go to orders list
        isAuthRoute("/customer/orders/index");
        return;
      }

      // ==================== SERVICES ROUTES ====================
      // Website: /services/{slug} -> App: /customer/services/[slug]
      if (path.includes("services/")) {
        const slug = path.split("services/")[1]?.split("/")[0];
        if (slug && slug !== "index") {
          router.push(`/customer/services/${slug}`);
          return;
        }
      }

      // Website: /categories/{slug} -> App: /(tabs)/services (with slug param)
      if (path.includes("categories/")) {
        const slug = path.split("categories/")[1]?.split("/")[0];
        if (slug) {
          // Navigate to services tab with category filter
          router.push({
            pathname: "/customer",
            params: { categorySlug: slug },
          });
          return;
        }
      }

      // ==================== CHAT ROUTES ====================
      // Website: /chat/{workOrderId} -> App: /customer/order-chat/{workOrderId}
      if (path.includes("chat/")) {
        const workOrderId = path.split("chat/")[1]?.split("/")[0];
        if (workOrderId) {
          isAuthRoute(`/customer/order-chat/${workOrderId}`);
          return;
        }
      }

      // ==================== SCHEDULE/CART ROUTES ====================
      // Website: /schedule -> App: /customer/shop/schedule
      if (path === "schedule" || path === "/schedule") {
        isAuthRoute("/customer/shop/schedule");
        return;
      }

      // Website: /cart -> App: /customer/shop/cart
      if (path === "cart" || path === "/cart") {
        isAuthRoute("/customer/shop/cart");
        return;
      }

      // Website: /checkout -> App: /customer/shop/checkout
      if (path === "checkout" || path === "/checkout") {
        isAuthRoute("/customer/shop/checkout");
        return;
      }

      // ==================== AUTH ROUTES ====================
      // Website: /auth/login -> App: /auth/customer/sign-in
      if (path.includes("auth/login") || path.includes("login")) {
        router.push("/auth/customer/sign-in");
        return;
      }

      // ==================== CUSTOM SCHEME ====================
      // tasker-company://{route}
      if (url.startsWith("tasker-company://")) {
        const route = url.replace("tasker-company://", "");

        if (route.startsWith("orders/")) {
          const orderNumber = route.split("orders/")[1];
          isAuthRoute(`/customer/orders/${orderNumber}`);
          return;
        }

        if (route.startsWith("chat/")) {
          const workOrderId = route.split("chat/")[1];
          isAuthRoute(`/customer/order-chat/${workOrderId}`);
          return;
        }

        if (route.startsWith("services/")) {
          const slug = route.split("services/")[1];
          router.push(`/customer/services/${slug}`);
          return;
        }

        if (route === "schedule" || route === "cart" || route === "checkout") {
          isAuthRoute(`/customer/shop/${route}`);
          return;
        }
      }

      console.log("[DeepLink] No matching route found for:", path);
    };

    // Get initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for URL events (app already open)
    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url) handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [isLoading, router]);

  return (
    <>
      {shouldUseEcho ? (
        <EchoProvider>
          <StatusBar style="dark" backgroundColor={Colors.background.primary} />
          <OTAUpdateManager />
          <NetworkStatus />
          <RootNavigator />
          <Toast />
          <DebugPanel />
        </EchoProvider>
      ) : (
        <>
          <StatusBar style="dark" backgroundColor={Colors.background.primary} />
          <OTAUpdateManager />
          <NetworkStatus />
          <RootNavigator />
          <Toast />
          <DebugPanel />
        </>
      )}
    </>
  );
}

function RootNavigator() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchError = useAuthStore((state) => state.fetchError);
  const user = useAuthStore((state) => state.user);
  const refetchUser = useAuthStore((state) => state.refetchUser);
  const signOut = useAuthStore((state) => state.signOut);
  const customerToken = useAuthStore((state) => state.customerToken);
  const vendorToken = useAuthStore((state) => state.vendorToken);
  const vendorStaffToken = useAuthStore((state) => state.vendorStaffToken);

  // Enable notification deep linking
  useNotificationDeepLink();

  const showFetchError =
    !isLoading &&
    (customerToken || vendorToken || vendorStaffToken) &&
    !user &&
    !!fetchError;

  if (isLoading) {
    return <Splash />;
  }

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      />
      <AlertModal
        visible={showFetchError as any}
        type="error"
        title="Connection Issue"
        message="We couldn't load your account. Please check your internet and try again."
        onClose={() => {}}
        primaryButton={{
          text: "Retry",
          onPress: () => {
            void refetchUser();
          },
        }}
        secondaryButton={{
          text: "Logout",
          onPress: () => {
            void signOut();
          },
        }}
      />
    </>
  );
}
