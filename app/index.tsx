import Splash from "@/components/splash";
import { useAuthStore } from "@/context/auth-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "@tasker_onboarding_complete";

export default function Index() {
  const { isLoading, customerToken, vendorToken, vendorStaffToken, appMode } =
    useAuthStore();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingComplete(value === "true");
      } catch {
        setOnboardingComplete(false);
      }
    };
    checkOnboarding();
  }, []);

  if (isLoading || onboardingComplete === null) {
    return <Splash />;
  }

  const hasCustomer = !!customerToken;
  const hasVendor = !!vendorToken;
  const hasVendorStaff = !!vendorStaffToken;

  // Show onboarding if not complete and no user is logged in
  if (!onboardingComplete && !hasCustomer && !hasVendor && !hasVendorStaff) {
    return <Redirect href="/auth/onboarding" />;
  }

  // If current appMode token is missing, fallback to another available token
  let effectiveMode = appMode;
  if (appMode === "vendor" && !hasVendor) {
    effectiveMode = hasCustomer ? "customer" : hasVendorStaff ? "vendor_staff" : null;
  } else if (appMode === "vendor_staff" && !hasVendorStaff) {
    effectiveMode = hasVendor ? "vendor" : hasCustomer ? "customer" : null;
  } else if (appMode === "customer" && !hasCustomer) {
    effectiveMode = hasVendor ? "vendor" : hasVendorStaff ? "vendor_staff" : null;
  }

  let href = "/auth/role-selection";

  if (effectiveMode === "customer") {
    href = hasCustomer ? "/customer" : "/auth/customer/sign-in";
  } else if (effectiveMode === "vendor") {
    href = hasVendor ? "/vendor/(tabs)/dashboard" : "/auth/vendor/sign-in";
  } else if (effectiveMode === "vendor_staff") {
    href = hasVendorStaff ? "/vendor/(tabs)/dashboard" : "/auth/vendor/sign-in";
  }

  return <Redirect href={href as any} />;
}
