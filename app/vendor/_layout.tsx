import { Redirect, Stack, usePathname, router } from "expo-router";
import { useSession } from "@/context/ctx";
import React, { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import axios from "@/lib/axios.config";
import { API_URL } from "@/lib/api-endpoints";
import { View } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import VendorSilentModeBanner from "@/components/vendor/VendorSilentModeBanner";

export default function VendorLayout() {
  const { session } = useSession();
  const pathname = usePathname();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    async function checkProfileStatus() {
      if (
        session.isAuthenticated &&
        session.appMode === "vendor" &&
        session.token
      ) {
        // If vendor is actively in the complete-profile flow, allow them to proceed uninterrupted
        if (pathname.includes("/complete-profile")) {
          return;
        }

        try {
          // Use vendorUser from session if available, or fetch fresh
          let user: any = session.vendorUser;
          let isComplete = user?.is_profile_complete;

          if (!user) {
            const res = await axios.get(`${API_URL}/vendor/me`, {
              headers: { Authorization: `Bearer ${session.token}` },
            });
            isComplete = res.data?.is_profile_complete;
            user = res.data?.user;
          }

          // If vendor is active and approved by admin, bypass onboarding check
          const isApproved = user?.status === "active";
          if (isApproved) {
            const permissionsDone = await AsyncStorage.getItem(
              "@vendor_permissions_completed"
            );
            if (!permissionsDone) {
              if (!pathname.includes("/permissions")) {
                router.replace("/vendor/permissions" as any);
              }
              return;
            }

            // Approved and permissions done: redirect away from onboarding/pending/permissions to dashboard
            if (
              pathname.includes("/pending-approval") ||
              pathname.includes("/complete-profile") ||
              pathname.includes("/permissions")
            ) {
              router.replace("/vendor/(tabs)" as any);
            }
            return;
          }

          const step2Completed = Boolean(user?.cnic_front_image);
          const step3Completed = Boolean(
            user?.cnic &&
            user?.name &&
            !String(user.name).startsWith("Partner ")
          );
          const step4Completed = Boolean(user?.profile_image);
          const refs = user?.references;
          const step5Completed = Boolean(
            refs &&
            Array.isArray(refs) &&
            refs.length >= 2 &&
            refs[0]?.name &&
            refs[0]?.phone &&
            refs[1]?.name &&
            refs[1]?.phone
          );
          const step6Completed = Boolean(user?.education && user?.marital_status);

          const isProfileComplete = Boolean(
            isComplete ??
            (step2Completed &&
              step3Completed &&
              step4Completed &&
              step5Completed &&
              step6Completed)
          );

          if (!isProfileComplete) {
            if (!step2Completed) {
              if (!pathname.includes("/complete-profile/step-2")) {
                router.replace("/vendor/complete-profile/step-2" as any);
              }
            } else if (!step3Completed) {
              if (!pathname.includes("/complete-profile/step-3")) {
                router.replace("/vendor/complete-profile/step-3" as any);
              }
            } else if (!step4Completed) {
              if (!pathname.includes("/complete-profile/step-4")) {
                router.replace("/vendor/complete-profile/step-4" as any);
              }
            } else if (!step5Completed) {
              if (!pathname.includes("/complete-profile/step-5")) {
                router.replace("/vendor/complete-profile/step-5" as any);
              }
            } else if (!step6Completed) {
              if (!pathname.includes("/complete-profile/step-6")) {
                router.replace("/vendor/complete-profile/step-6" as any);
              }
            } else {
              if (!pathname.includes("/complete-profile")) {
                router.replace("/vendor/complete-profile" as any);
              }
            }
            return;
          }

          // Profile is complete but not active: keep on pending approval
          if (!pathname.includes("/pending-approval")) {
            router.replace("/vendor/pending-approval" as any);
          }
          return;
        } catch (e) {
          console.error("[VendorLayout] Error checking profile status:", e);
        }
      }
    }

    checkProfileStatus();
  }, [session.isAuthenticated, session.appMode, session.token, pathname]);

  useEffect(() => {
    const registerToken = async () => {
      // Vendors and Staff share this layout, but we need correct endpoint mapping.
      if (session.isAuthenticated && expoPushToken && session.token) {
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
          // Log softly; push token errors must never interrupt vendor sessions
          console.log(
            "[Push] Vendor push token registration notice:",
            error?.response?.status || error.message,
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
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {/* Protected operational screens for authenticated vendors/staff */}
        <Stack.Protected
          guard={
            Boolean(
              session.isAuthenticated &&
              (session.appMode === "vendor" || session.appMode === "vendor_staff")
            )
          }
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quick-pay" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="permissions" />
          <Stack.Screen name="work-order-details/[id]" />
          <Stack.Screen name="work-order-edit/[id]" />
          <Stack.Screen name="staff" />
          <Stack.Screen name="work-order-chat/[id]" />
        </Stack.Protected>

        {/* Lifecycle & Public screens within vendor section */}
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="pending-approval" />
        <Stack.Screen
          name="support-chat"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </View>
  );
}
