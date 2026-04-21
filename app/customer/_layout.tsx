import { Redirect, Stack } from "expo-router";
import { useSession } from "@/context/ctx";
import React, { useEffect } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import axios from "@/lib/axios.config";
import { API_URL } from "@/lib/api-endpoints";

export default function CustomerLayout() {
  const { session } = useSession();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    console.log("expoPushToken", expoPushToken);
    const registerToken = async () => {
      if (session.isAuthenticated && expoPushToken) {
        try {
          const endpoint = `${API_URL}/tasker-app/notifications/register-token`;
          await axios.post(
            endpoint,
            { token: expoPushToken },
            { headers: { Authorization: `Bearer ${session.token}` } },
          );
          console.log(`[Push] Customer Layout registered token to ${endpoint}`);
        } catch (error: any) {
          console.error(
            "[Push] Failed to register push token in Customer Layout:",
            error?.response?.data || error.message,
          );
        }
      }
    };
    registerToken();
  }, [session.isAuthenticated, expoPushToken, session.token]);

  if (session.isLoading) {
    return null;
  }

  if (!session.isAuthenticated || session.appMode !== "customer") {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="orders/history" />
      <Stack.Screen name="orders/[orderNumber]" />
      <Stack.Screen name="commercial-quote/index" />
      <Stack.Screen name="contact-us/index" />
      <Stack.Screen name="free-installation/index" />
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/addresses" />
      <Stack.Screen name="services/[slug]" />
      <Stack.Screen
        name="support-chat"
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="order-chat/[id]" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
