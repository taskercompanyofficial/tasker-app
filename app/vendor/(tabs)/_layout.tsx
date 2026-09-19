import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useRef } from "react";

export default function VendorTabsLayout() {
  const { session } = useSession();

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
