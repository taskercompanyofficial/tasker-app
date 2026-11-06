import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

export type WorkOrderTabKey = "details" | "attachments" | "activity";

interface WorkOrderMinimalTabBarProps {
  activeTab: WorkOrderTabKey;
  onTabChange: (tab: WorkOrderTabKey) => void;
  requiredAttachmentsCount?: number;
  uploadedAttachmentsCount?: number;
  activityCount?: number;
}

export default function WorkOrderMinimalTabBar({
  activeTab,
  onTabChange,
  requiredAttachmentsCount = 0,
  uploadedAttachmentsCount = 0,
  activityCount = 0,
}: WorkOrderMinimalTabBarProps) {
  const allRequiredUploaded =
    requiredAttachmentsCount > 0 &&
    uploadedAttachmentsCount >= requiredAttachmentsCount;

  return (
    <View style={styles.container}>
      {/* Details Tab */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "details" && styles.tabButtonActive,
        ]}
        onPress={() => onTabChange("details")}
        activeOpacity={0.75}
      >
        <Ionicons
          name={activeTab === "details" ? "document-text" : "document-text-outline"}
          size={16}
          color={activeTab === "details" ? "#0F172A" : "#64748B"}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "details" && styles.tabTextActive,
          ]}
        >
          Details
        </Text>
      </TouchableOpacity>

      {/* Attachments Tab */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "attachments" && styles.tabButtonActive,
        ]}
        onPress={() => onTabChange("attachments")}
        activeOpacity={0.75}
      >
        <Ionicons
          name={activeTab === "attachments" ? "images" : "images-outline"}
          size={16}
          color={activeTab === "attachments" ? "#0F172A" : "#64748B"}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "attachments" && styles.tabTextActive,
          ]}
        >
          Attachments
        </Text>
        {requiredAttachmentsCount > 0 && (
          <View
            style={[
              styles.badge,
              allRequiredUploaded ? styles.badgeSuccess : styles.badgePending,
            ]}
          >
            {allRequiredUploaded ? (
              <Ionicons name="checkmark" size={11} color="#059669" />
            ) : (
              <Text style={styles.badgeText}>
                {uploadedAttachmentsCount}/{requiredAttachmentsCount}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Activity Tab */}
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "activity" && styles.tabButtonActive,
        ]}
        onPress={() => onTabChange("activity")}
        activeOpacity={0.75}
      >
        <Ionicons
          name={activeTab === "activity" ? "time" : "time-outline"}
          size={16}
          color={activeTab === "activity" ? "#0F172A" : "#64748B"}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "activity" && styles.tabTextActive,
          ]}
        >
          Activity
        </Text>
        {activityCount > 0 && (
          <View style={styles.badgeNeutral}>
            <Text style={styles.badgeNeutralText}>{activityCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 0,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 5,
  },
  tabButtonActive: {
    borderBottomColor: "#0F172A",
  },
  tabIcon: {
    marginRight: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
  },
  badgeSuccess: {
    backgroundColor: "#D1FAE5",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#92400E",
  },
  badgeNeutral: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeNeutralText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
});
