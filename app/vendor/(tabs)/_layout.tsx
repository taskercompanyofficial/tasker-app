import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

export default function VendorTabsLayout() {
  const { session } = useSession();
  const { t } = useLanguage();

  if (
    !session.isAuthenticated ||
    (session.appMode !== "vendor" && session.appMode !== "vendor_staff")
  ) {
    return <Redirect href="/" />;
  }

  const isStaff =
    session.appMode === "vendor_staff" ||
    (session.user as any)?.user_type === "vendor_staff";

  // 20% transparent (80% opacity) on Android for translucent glass effect
  const tabBgColor =
    Platform.OS === "android"
      ? "rgba(255, 255, 255, 0.80)"
      : Colors.neutral.white;

  return (
    <NativeTabs
      backgroundColor={tabBgColor}
      tintColor={Colors.themes.provider.primary}
      indicatorColor={
        Platform.OS === "android" ? "rgba(30, 58, 138, 0.12)" : undefined
      }
      rippleColor={
        Platform.OS === "android" ? "rgba(30, 58, 138, 0.15)" : undefined
      }
      iconColor={{
        default: Colors.neutral.gray[500],
        selected: Colors.themes.provider.primary,
      }}
      labelStyle={{
        default: {
          fontSize: 11,
          fontWeight: "600",
          color: Colors.neutral.gray[500],
        },
        selected: {
          fontSize: 11,
          fontWeight: "800",
          color: Colors.themes.provider.primary,
        },
      }}
      labelVisibilityMode={Platform.OS === "android" ? "labeled" : undefined}
      tabBarRespectsIMEInsets={true}
    >
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>{t.vendor.tabs.dashboard}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs">
        <NativeTabs.Trigger.Label>{t.vendor.tabs.jobs}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="briefcase.fill" md="work" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>{t.vendor.tabs.chat}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.bubble.right.fill" md="forum" />
      </NativeTabs.Trigger>
      {!isStaff && (
        <NativeTabs.Trigger name="ledger">
          <NativeTabs.Trigger.Label>{t.vendor.tabs.ledger}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="list.bullet.circle.fill" md="format_list_bulleted" />
        </NativeTabs.Trigger>
      )}
      {!isStaff && (
        <NativeTabs.Trigger name="earnings">
          <NativeTabs.Trigger.Label>{t.vendor.tabs.earnings}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="creditcard.fill" md="account_balance_wallet" />
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t.vendor.tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
