import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

export default function TabsLayout() {
  const { session } = useSession();
  const { t } = useLanguage();

  if (!session.isAuthenticated || session.appMode !== "customer") {
    return <Redirect href="/" />;
  }

  // 20% transparent (80% opacity) on Android for translucent glass effect
  const tabBgColor =
    Platform.OS === "android"
      ? "rgba(255, 255, 255, 0.80)"
      : Colors.neutral.white;

  return (
    <NativeTabs
      backgroundColor={tabBgColor}
      tintColor={Colors.themes.customer.primary}
      indicatorColor={
        Platform.OS === "android" ? "rgba(27, 71, 127, 0.12)" : undefined
      }
      rippleColor={
        Platform.OS === "android" ? "rgba(27, 71, 127, 0.15)" : undefined
      }
      iconColor={{
        default: Colors.neutral.gray[500],
        selected: Colors.themes.customer.primary,
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
          color: Colors.themes.customer.primary,
        },
      }}
      labelVisibilityMode={Platform.OS === "android" ? "labeled" : undefined}
      tabBarRespectsIMEInsets={true}
    >
      <NativeTabs.Trigger name="[slug]">
        <NativeTabs.Trigger.Label>{t.customer.tabs.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>{t.customer.tabs.orders}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="services">
        <NativeTabs.Trigger.Label>{t.customer.tabs.services}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2.fill" md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t.customer.tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
