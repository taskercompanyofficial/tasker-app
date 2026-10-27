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

  // Tasker emerald green smooth color branding
  const primaryEmerald = "#059669";
  const defaultInactive = "#94A3B8";

  // 20% transparent (80% opacity) on Android for translucent glass effect
  const tabBgColor =
    Platform.OS === "android"
      ? "rgba(255, 255, 255, 0.95)"
      : Colors.neutral.white;

  return (
    <NativeTabs
      backgroundColor={tabBgColor}
      tintColor={primaryEmerald}
      indicatorColor={
        Platform.OS === "android" ? "rgba(5, 150, 105, 0.12)" : undefined
      }
      rippleColor={
        Platform.OS === "android" ? "rgba(5, 150, 105, 0.15)" : undefined
      }
      iconColor={{
        default: defaultInactive,
        selected: primaryEmerald,
      }}
      labelStyle={{
        default: {
          fontSize: 11,
          fontWeight: "600",
          color: defaultInactive,
        },
        selected: {
          fontSize: 11,
          fontWeight: "800",
          color: primaryEmerald,
        },
      }}
      labelVisibilityMode={Platform.OS === "android" ? "labeled" : undefined}
      tabBarRespectsIMEInsets={true}
    >
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>{t.vendor.tabs.dashboard}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs">
        <NativeTabs.Trigger.Label>{t.vendor.tabs.jobs}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bolt.horizontal.fill" md="assignment" />
      </NativeTabs.Trigger>
      {!isStaff && (
        <NativeTabs.Trigger name="earnings">
          <NativeTabs.Trigger.Label>{t.vendor.tabs.earnings}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="wallet.pass.fill" md="payments" />
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t.vendor.tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="tune" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
