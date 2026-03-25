import { Stack, useRouter, useSegments } from "expo-router";
import { useSession } from "@/context/ctx";
import React, { useEffect } from "react";

export default function VendorLayout() {
  const { session } = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (session.isLoading) return;

    const user = session.vendorUser;
    const isVendor = session.appMode === "vendor" && !!session.vendorToken;
    const currentPath = segments.join("/");

    if (isVendor && user) {
      const isIncomplete =
        !user.cnic || !user.cnic_front_image || !user.cnic_back_image;
      const isPending = user.status === "pending";

      // Allow access to complete-profile even if pending
      if (isIncomplete && !currentPath.includes("complete-profile")) {
        router.replace("/vendor/complete-profile");
      } else if (
        !isIncomplete &&
        isPending &&
        !currentPath.includes("pending-approval")
      ) {
        router.replace("/vendor/pending-approval");
      } else if (
        !isIncomplete &&
        !isPending &&
        (currentPath.includes("complete-profile") ||
          currentPath.includes("pending-approval"))
      ) {
        // If approved and complete, but on a restricted page, go to dashboard
        router.replace("/vendor/(tabs)/dashboard");
      }
    }
  }, [session.vendorUser, session.isLoading, segments]);

  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="work-order-details/[id]" />
      <Stack.Screen name="work-order-edit/[id]" />
      <Stack.Screen name="staff/index" />
      <Stack.Screen name="staff/add" />
      <Stack.Screen name="staff/[id]" />
    </Stack>
  );
}
