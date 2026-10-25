import AppText from "@/components/common/AppText";
// ⚠️  Must be the FIRST import — registers the vendor background location task
// with expo-task-manager before any navigation or component mounts.
import "@/tasks/vendorLocationTask";

import AlertModal from "@/components/common/AlertModal";

import DebugPanel from "@/components/common/DebugPanel";
import OTAUpdateManager from "@/components/common/OTAUpdateManager";
import NetworkStatus from "@/components/NetworkStatus";
import Splash from "@/components/splash";
import Colors from "@/constants/Colors";
import { useAuthStore } from "@/context/auth-store";
import { EchoProvider } from "@/context/EchoProvider";
import { useNetwork } from "@/hooks/use-network";
import { VoiceCallProvider } from "@/context/VoiceCallContext";
import { LanguageProvider, useLanguage } from "@/context/language-context";
import VendorActiveTripBubble from "@/components/vendor/VendorActiveTripBubble";

import { addDebugLog, initRemoteLogging } from "@/lib/debug-monitor";
import { Observe, ObserveRoot, useObserve } from "@/lib/observe";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  useColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";


// Configure EAS Observe safely
try {
  Observe.configure({
    dispatchInDebug: true,
    integrations: {
      "expo-router": {
        filteredParams: ["token", "customerToken", "vendorToken", "password"],
      },
    },
  });
} catch (e) {
  console.warn("[Observe] Failed to configure Observe:", e);
}

function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoading = useAuthStore((state) => state.isLoading);
  const appMode = useAuthStore((state) => state.appMode);
  const renderCountRef = useRef(0);
  const lastRenderDebugAtRef = useRef(0);

  // EAS Observe metric hook (safely handled by lib/observe)
  const { markInteractive } = useObserve();

  renderCountRef.current += 1;

  useEffect(() => {
    initRemoteLogging();
    const runInit = () => {
      useAuthStore.getState().initialize();
    };

    if (useAuthStore.persist.hasHydrated()) {
      runInit();
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        unsub();
        runInit();
      });
    }
  }, []);


  // Mark app interactive once auth initialization completes
  useEffect(() => {
    if (!isLoading) {
      markInteractive();
    }
  }, [isLoading, markInteractive]);

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
      path: pathname,
    });
  }, [isLoading, appMode, pathname]);

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

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? "#121212" : Colors.neutral.white);
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
  }, [isDark]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <BottomSheetModalProvider>
          <EchoProvider>
            <VoiceCallProvider>
              <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={
                  isDark ? "rgba(0, 0, 0, 0.40)" : "rgba(255, 255, 255, 0.40)"
                }
                translucent
              />
              <OTAUpdateManager />
              <NetworkStatus />
              <RootNavigator />
              <Toast />
              <DebugPanel />
              {/* Floating trip bubble — visible on all screens during an active vendor job */}
              <VendorActiveTripBubble />
            </VoiceCallProvider>
          </EchoProvider>
        </BottomSheetModalProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { isLoading: isLanguageLoading } = useLanguage();
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchError = useAuthStore((state) => state.fetchError);
  const user = useAuthStore((state) => state.user);
  const refetchUser = useAuthStore((state) => state.refetchUser);
  const signOut = useAuthStore((state) => state.signOut);
  const customerToken = useAuthStore((state) => state.customerToken);
  const vendorToken = useAuthStore((state) => state.vendorToken);
  const vendorStaffToken = useAuthStore((state) => state.vendorStaffToken);

  const { isOffline } = useNetwork();

  const [fontsLoaded] = useFonts({
    "NotoNaskhArabic-Regular": require("@/assets/fonts/NotoNaskhArabic-Regular.ttf"),
    "NotoNaskhArabic-Bold": require("@/assets/fonts/NotoNaskhArabic-Bold.ttf"),
    "NotoNastaliqUrdu-Regular": require("@/assets/fonts/NotoNastaliqUrdu-Regular.ttf"),
    "NotoNastaliqUrdu-Bold": require("@/assets/fonts/NotoNastaliqUrdu-Bold.ttf"),
  });

  const [splashTimerEnded, setSplashTimerEnded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashTimerEnded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const showFetchError =
    !isLoading &&
    !isOffline &&
    (customerToken || vendorToken || vendorStaffToken) &&
    !user &&
    !!fetchError;

  if (isLoading || isLanguageLoading || !splashTimerEnded || !fontsLoaded) {
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
        onClose={() => { }}
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

function DefaultErrorFallback() {
  return (
    <View style={errorStyles.container}>
      <AppText style={errorStyles.title}>Something went wrong</AppText>
      <AppText style={errorStyles.subtitle}>
        An unexpected error occurred. Please restart the app.
      </AppText>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});

export default function ObserveWrappedRootLayout() {
  return (
    <ObserveRoot errorBoundaryFallback={<DefaultErrorFallback />}>
      <RootLayout />
    </ObserveRoot>
  );
}
