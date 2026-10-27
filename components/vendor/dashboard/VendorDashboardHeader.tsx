import React from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/common/AppText";

interface VendorDashboardHeaderProps {
  userName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  togglingOnline?: boolean;
  isLocked?: boolean;
  onToggleOnline?: (targetValue: boolean) => void;
  onPressNotifications: () => void;
  onPressQuickPay?: () => void;
}

export default function VendorDashboardHeader({
  userName,
  avatarUrl,
  isOnline = false,
  onPressNotifications,
  onPressQuickPay,
}: VendorDashboardHeaderProps) {
  const avatarInitial = (userName?.charAt(0) || "P").toUpperCase();

  return (
    <View style={styles.topBar}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <AppText style={styles.avatarText}>{avatarInitial}</AppText>
            </View>
          )}
          <View
            style={[
              styles.avatarStatusDot,
              {
                backgroundColor: isOnline ? "#10B981" : "#94A3B8",
              },
            ]}
          />
        </View>
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText style={styles.partnerRole}>Verified Partner</AppText>
            {isOnline && (
              <View style={styles.liveBadgeSmall}>
                <View style={styles.liveDotSmall} />
                <AppText style={styles.liveBadgeSmallText}>LIVE</AppText>
              </View>
            )}
          </View>
          <AppText style={styles.partnerName} numberOfLines={1}>
            {userName}
          </AppText>
        </View>
      </View>

      {/* Top Bar Actions: Pay/QR Button + Notifications Bell (Flat, Zero Shadows) */}
      <View style={styles.topBarActions}>
        <TouchableOpacity
          style={styles.iconCircle}
          activeOpacity={0.75}
          onPress={onPressQuickPay}
        >
          <Ionicons name="qr-code-outline" size={19} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconCircle}
          activeOpacity={0.75}
          onPress={onPressNotifications}
        >
          <Ionicons name="notifications-outline" size={19} color="#334155" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "relative",
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  avatarStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#F2F3F5",
  },
  partnerRole: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#94A3B8",
    lineHeight: 13,
  },
  liveBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  liveDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  liveBadgeSmallText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#065F46",
    letterSpacing: 0.5,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 18,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
});
