import { Redirect, Stack, usePathname, router } from "expo-router";
import { useSession } from "@/context/ctx";
import React, { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import axios from "@/lib/axios.config";
import { API_URL } from "@/lib/api-endpoints";
import { View } from "react-native";
import { PermanentFloatingChatBubble } from "@/components/Chat/PermanentFloatingChatBubble";

import AsyncStorage from "@react-native-async-storage/async-storage";

import VendorLocationGateModal from "@/components/vendor/VendorLocationGateModal";
import VendorSilentModeBanner from "@/components/vendor/VendorSilentModeBanner";

export default function VendorLayout() {
  const { session } = useSession();
  const pathname = usePathname();
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    async function checkProfileAndOnboarding() {
      if (
        session.isAuthenticated &&
        session.appMode === "vendor" &&
        session.token
      ) {
        try {
          // Request call to backend to verify if profile is completed
          const res = await axios.get(`${API_URL}/vendor/me`, {
            headers: { Authorization: `Bearer ${session.token}` },
          });
          const isComplete = res.data?.is_profile_complete;
          const user = res.data?.user;

          const step2Completed = Boolean(user?.cnic_front_image);
          const step3Completed = Boolean(
            user?.cnic &&
              user?.name &&
              !String(user.name).startsWith("Partner ") &&
              user?.father_name &&
              user?.dob &&
              user?.address &&
              user?.current_address
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
            if (
              !pathname.includes("/complete-profile") &&
              !pathname.includes("/onboarding")
            ) {
              if (!step2Completed) {
                router.replace("/vendor/complete-profile/step-2" as any);
              } else if (!step3Completed) {
                router.replace("/vendor/complete-profile/step-3" as any);
              } else if (!step4Completed) {
                router.replace("/vendor/complete-profile/step-4" as any);
              } else if (!step5Completed) {
                router.replace("/vendor/complete-profile/step-5" as any);
              } else if (!step6Completed) {
                router.replace("/vendor/complete-profile/step-6" as any);
              } else {
                router.replace("/vendor/complete-profile" as any);
              }
              return;
            }
          } else {
            // Profile is 100% complete: check admin activation status
            const isApproved = user?.status === "active";

            if (!isApproved) {
              // If account is not active (e.g. pending review), block access to dashboard and tabs
              if (
                !pathname.includes("/pending-approval") &&
                !pathname.includes("/onboarding")
              ) {
                router.replace("/vendor/pending-approval" as any);
                return;
              }
            } else {
              // Account is active & approved: redirect out of pending-approval and complete-profile
              if (
                pathname.includes("/complete-profile") ||
                pathname.includes("/pending-approval")
              ) {
                router.replace("/vendor/(tabs)" as any);
                return;
              }
            }
          }
        } catch (e) {
          console.error("[VendorLayout] Error checking profile status:", e);
        }
      }

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

    checkProfileAndOnboarding();
  }, [session.isAuthenticated, session.appMode, session.token, pathname]);

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
