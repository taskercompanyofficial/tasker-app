import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface EditHeaderProps {
  onInfoPress?: () => void;
  workOrderNumber?: string | number;
  serviceName?: string;
  countdown?: string;
}

export default function EditHeader({
  onInfoPress,
  workOrderNumber,
  serviceName,
  countdown,
}: EditHeaderProps) {
  const title = workOrderNumber
    ? String(workOrderNumber).startsWith("#")
      ? `Order ${workOrderNumber}`
      : `Order #${workOrderNumber}`
    : "Edit Work Order";

  return (
    <View style={styles.header}>
      {/* 1. Left: Back Button (Flat, No Shadows) */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <DirectionalIcon name="arrow-back" size={20} color="#0F172A" />
      </TouchableOpacity>

      {/* 2. Mid: Work Order Number & Service Type */}
      <View style={styles.headerCenter}>
        <AppText style={styles.headerTitle} numberOfLines={1}>
          {title}
        </AppText>
        {serviceName ? (
          <AppText style={styles.headerSubtitle} numberOfLines={1}>
            {serviceName}
          </AppText>
        ) : null}
      </View>

      {/* 3. Right Corner: Countdown Timer or Info Icon (Flat, No Shadows) */}
      {countdown ? (
        <View style={styles.headerTimerBadge}>
          <View style={styles.headerTimerDot} />
          <AppText style={styles.headerTimerDigits}>{countdown}</AppText>
        </View>
      ) : onInfoPress ? (
        <TouchableOpacity
          onPress={onInfoPress}
          style={styles.infoButton}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={Colors.themes.provider.primary}
          />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  headerTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    backgroundColor: "#FFFBEB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  headerTimerDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: "#D97706",
  },
  headerTimerDigits: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
