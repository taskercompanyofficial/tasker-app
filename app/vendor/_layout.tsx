import { Redirect, Stack } from "expo-router";
import { useSession } from "@/context/ctx";
import React, { useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import axios from "@/lib/axios.config";
import { API_URL } from "@/lib/api-endpoints";
import { View } from "react-native";
import { PermanentFloatingChatBubble } from "@/components/Chat/PermanentFloatingChatBubble";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import VendorLocationGateModal from "@/components/vendor/VendorLocationGateModal";
import VendorSilentModeBanner from "@/components/vendor/VendorSilentModeBanner";

export default function VendorLayout() {
  const { session } = useSession();

  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    async function checkOnboarding() {
      if (
        session.isAuthenticated &&
        (session.appMode === "vendor" || session.appMode === "vendor_staff")
      ) {
        try {
          const completed = await AsyncStorage.getItem(
            "@vendor_onboarding_completed"
          );
          if (!completed) {
            router.replace("/vendor/onboarding");
          }
        } catch (e) {}
      }
    }
    checkOnboarding();
  }, [session.isAuthenticated, session.appMode]);

  useEffect(() => {
    const registerToken = async () => {
      // Vendors and Staff share this layout, but we need correct endpoint mapping.
      if (session.isAuthenticated && expoPushToken) {
        try {
          const endpoint =
            session.appMode === "vendor_staff"
              ? `${API_URL}/vendor-staff/notifications/register-token`
              : `${API_URL}/vendor/notifications/register-token`;

          await axios.post(
            endpoint,
            { token: expoPushToken },
            { headers: { Authorization: `Bearer ${session.token}` } },
          );
          console.log(`[Push] Vendor Layout registered token to ${endpoint}`);
        } catch (error: any) {
          console.error(
            "[Push] Failed to register push token in Vendor Layout:",
            error?.response?.data || error.message,
          );
        }
      }
    };
    registerToken();
  }, [session.isAuthenticated, expoPushToken, session.appMode, session.token]);

  if (session.isLoading) {
    return null;
  }

  if (
    !session.isAuthenticated ||
    (session.appMode !== "vendor" && session.appMode !== "vendor_staff")
  ) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <VendorSilentModeBanner />
      <VendorLocationGateModal />
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="pending-approval" />
        <Stack.Screen name="work-order-details/[id]" />
        <Stack.Screen name="work-order-edit/[id]" />
        <Stack.Screen name="staff/index" />
        <Stack.Screen name="staff/add" />
        <Stack.Screen name="staff/[id]" />
        <Stack.Screen
          name="support-chat"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="work-order-chat/[id]" />
      </Stack>
      <PermanentFloatingChatBubble />
    </View>
  );
}
