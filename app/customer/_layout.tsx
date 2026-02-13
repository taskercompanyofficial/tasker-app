import { Stack } from "expo-router";
import { useSession } from "@/context/ctx";
import React from "react";

export default function CustomerLayout() {
  const { session } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
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
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
