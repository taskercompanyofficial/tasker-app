import React from "react";
import { Redirect } from "expo-router";
import Splash from "@/components/splash";
import { useSession } from "@/context/ctx";

export default function Index() {
  const { session } = useSession();

  if (session.isLoading) {
    return <Splash />;
  }

  const hasCustomer = !!session.customerToken;
  const hasVendor = !!session.vendorToken;

  let href = "/auth/role-selection";

  if (session.appMode === "customer") {
    href = hasCustomer ? "/customer" : "/auth/customer/sign-in";
  } else if (session.appMode === "vendor") {
    href = hasVendor ? "/vendor" : "/auth/vendor/sign-in";
  } else if (hasCustomer) {
    href = "/customer";
  } else if (hasVendor) {
    href = "/vendor";
  }

  return <Redirect href={href as any} />;
}

