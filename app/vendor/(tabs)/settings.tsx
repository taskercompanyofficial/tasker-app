import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import React, { useMemo } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import myAxios from "@/lib/axios.config";
import { VENDOR_SIGN_OUT_URL } from "@/lib/api-endpoints";
import { router } from "expo-router";

export default function VendorSettings() {
  const { session, setAppMode, signOutMode } = useSession();
  const isVendor = useMemo(() => session.appMode === "vendor", [session.appMode]);

  const onSignOut = async () => {
    try {
      await myAxios.post(VENDOR_SIGN_OUT_URL);
    } catch {}
    await signOutMode("vendor");
    Toast.show({ type: "success", text1: "Signed out" });
    if (session.customerToken) {
      await setAppMode("customer");
      router.replace("/customer/(tabs)");
    } else {
      await setAppMode("customer");
      router.replace("/auth/customer/sign-in");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your provider account
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => setAppMode(isVendor ? "customer" : "vendor")}
          activeOpacity={0.7}
        >
          <View style={styles.listItemLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: Colors.themes.provider.primary + "15" },
              ]}
            >
              <Ionicons
                name="sync-outline"
                size={18}
                color={Colors.themes.provider.primary}
              />
            </View>
            <Text style={styles.listItemText}>
              Switch to {isVendor ? "Customer" : "Vendor"} Mode
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.text.tertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.listItem, styles.signOutItem]}
          onPress={onSignOut}
          activeOpacity={0.7}
        >
          <View style={styles.listItemLeft}>
            <View
              style={[styles.iconContainer, { backgroundColor: Colors.error + "15" }]}
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            </View>
            <Text style={[styles.listItemText, { color: Colors.error }]}>
              Sign Out
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={Colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  signOutItem: {
    marginTop: Spacing.md,
  },
})
