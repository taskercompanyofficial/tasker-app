import { Stack } from "expo-router";
import { useSession } from "@/context/ctx";
import React from "react";

export default function VendorLayout() {
  const { session } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
