import Splash from "@/components/splash";
import { SessionProvider, useSession } from "@/context/ctx";
import { EchoProvider } from "@/context/EchoProvider";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import Colors from "@/constants/Colors";
import React, { useEffect } from "react";
import AlertModal from "@/components/common/AlertModal";
import OTAUpdateManager from "@/components/common/OTAUpdateManager";

export default function RootLayout() {
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
  return (
    <SessionProvider>
      <EchoProvider>
        <StatusBar style="dark" backgroundColor={Colors.background.primary} />
        <OTAUpdateManager />
        <RootNavigator />
        <Toast />
      </EchoProvider>
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, refetchUser, signOut } = useSession();
  const showFetchError =
    !session.isLoading &&
    (session.customerToken || session.vendorToken || session.vendorStaffToken) &&
    !session.user &&
    !!session.fetchError;
  if (session.isLoading) {
    return <Splash />;
  }
  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Protected guard={!session.customerToken && !session.vendorToken && !session.vendorStaffToken}>
          <Stack.Screen name="auth/role-selection" />
          <Stack.Screen name="auth/onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={session.appMode === "customer" && !session.customerToken}>
          <Stack.Screen name="auth/customer/sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={(session.appMode === "vendor" || session.appMode === "vendor_staff") && !session.vendorToken && !session.vendorStaffToken}>
          <Stack.Screen name="auth/vendor/sign-in" />
          <Stack.Screen name="auth/vendor/register" />
        </Stack.Protected>
        <Stack.Protected guard={!!session.customerToken && session.appMode === "customer"}>
          <Stack.Screen name="customer" />
        </Stack.Protected>
        {/* Combine Vendor and Vendor Staff screens to avoid duplicate names */}
        <Stack.Protected guard={(!!session.vendorToken && session.appMode === "vendor") || (!!session.vendorStaffToken && session.appMode === "vendor_staff")}>
          <Stack.Screen name="vendor" />
        </Stack.Protected>
      </Stack>
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
