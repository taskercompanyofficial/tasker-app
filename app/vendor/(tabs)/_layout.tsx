import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useRef } from "react";

export default function VendorTabsLayout() {
  const { session } = useSession();
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;
  if (renderCountRef.current <= 20) {
    fetch("http://127.0.0.1:7789/ingest/e7df05fe-e28b-4c90-971d-c6d804cac73a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "54d0b8",
      },
      body: JSON.stringify({
        sessionId: "54d0b8",
        runId: "initial",
        hypothesisId: "H6_vendor_tabs_rerender_loop",
        location: "app/vendor/(tabs)/_layout.tsx:43",
        message: "Vendor tabs layout render count",
        data: {
          renderCount: renderCountRef.current,
          appMode: session.appMode,
          isAuthenticated: session.isAuthenticated,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { });
  }

  fetch("http://127.0.0.1:7789/ingest/e7df05fe-e28b-4c90-971d-c6d804cac73a", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "54d0b8",
    },
    body: JSON.stringify({
      sessionId: "54d0b8",
      runId: "initial",
      hypothesisId: "H2_tab_guard_rejects_session",
      location: "app/vendor/(tabs)/_layout.tsx:40",
      message: "Vendor tabs guard input state",
      data: {
        isAuthenticated: session.isAuthenticated,
        appMode: session.appMode,
        userType: (session.user as any)?.user_type ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => { });

  if (!session.isAuthenticated || (session.appMode !== "vendor" && session.appMode !== "vendor_staff")) {
    return <Redirect href="/" />;
  }

  const isStaff = session.appMode === "vendor_staff" || (session.user as any)?.user_type === "vendor_staff";

  return (
    <NativeTabs backgroundColor={Colors.background.tertiary}>
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs">
        <NativeTabs.Trigger.Label>Jobs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="briefcase.fill" md="work" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" md="forum" />
      </NativeTabs.Trigger>
      {!isStaff && (
        <NativeTabs.Trigger name="ledger">
          <NativeTabs.Trigger.Label>Rates</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="list.bullet.circle.fill" md="format_list_bulleted" />
        </NativeTabs.Trigger>
      )}
      {!isStaff && (
        <NativeTabs.Trigger name="earnings">
          <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="creditcard.fill" md="account_balance_wallet" />
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
