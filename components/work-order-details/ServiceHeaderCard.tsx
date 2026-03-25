import Colors from "@/constants/Colors";
import getImageUrl from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface ServiceHeaderCardProps {
  serviceName: string;
  parentServiceName?: string;
  workOrderNumber: string;
  createdAt: string;
  assignedAt?: string;
  productImage?: string;
  brandName?: string;
  priority?: string;
  categoryName?: string;
  brandComplaintNo?: string;
}

export default function ServiceHeaderCard({
  serviceName,
  parentServiceName,
  workOrderNumber,
  createdAt,
  assignedAt,
  productImage,
  brandName,
  priority,
  categoryName,
  brandComplaintNo,
}: ServiceHeaderCardProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getPriorityColor = (p: string) => {
    switch (p?.toLowerCase()) {
      case "urgent":
        return { bg: "#FEE2E2", text: "#DC2626" };
      case "high":
        return { bg: "#FEF3C7", text: "#D97706" };
      case "medium":
        return { bg: "#DBEAFE", text: "#2563EB" };
      case "low":
        return { bg: "#D1FAE5", text: "#059669" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const priorityStyle = getPriorityColor(priority || "medium");

  return (
    <View style={styles.headerCard}>
      {/* Top Row - Service Icon & Main Info */}
      <View style={styles.topRow}>
        <View style={styles.serviceIconContainer}>
          {productImage ? (
            <Image
              source={{ uri: getImageUrl(productImage) }}
              style={styles.serviceIcon}
            />
          ) : (
            <Ionicons
              name="construct"
              size={24}
              color={Colors.themes.provider.primary}
            />
          )}
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {parentServiceName || serviceName}
            </Text>
            {priority && (
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: priorityStyle.bg },
                ]}
              >
                <Text
                  style={[styles.priorityText, { color: priorityStyle.text }]}
                >
                  {priority}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.workOrderNumber}>{workOrderNumber}</Text>
          {brandComplaintNo && (
            <Text style={styles.brandComplaintNo}>
              Brand Complaint: {brandComplaintNo}
            </Text>
          )}
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        {brandName && (
          <View style={styles.infoItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={12}
              color="#6B7280"
            />
            <Text style={styles.infoLabel}>Brand:</Text>
            <Text style={styles.infoValue}>{brandName}</Text>
          </View>
        )}
        {categoryName && (
          <View style={styles.infoItem}>
            <Ionicons name="grid-outline" size={12} color="#6B7280" />
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{categoryName}</Text>
          </View>
        )}
      </View>

      {/* Timestamps */}
      <View style={styles.timestampRow}>
        <View style={styles.timestampItem}>
          <Ionicons name="calendar-outline" size={11} color="#9CA3AF" />
          <Text style={styles.timestampLabel}>Created:</Text>
          <Text style={styles.timestampValue}>{formatDateTime(createdAt)}</Text>
        </View>
        {assignedAt && (
          <View style={styles.timestampItem}>
            <Ionicons name="person-outline" size={11} color="#9CA3AF" />
            <Text style={styles.timestampLabel}>Assigned:</Text>
            <Text style={styles.timestampValue}>
              {formatDateTime(assignedAt)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 4,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(30, 64, 175, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  workOrderNumber: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  infoValue: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },
  timestampRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  timestampItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  timestampLabel: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  timestampValue: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  brandComplaintNo: {
    fontSize: 10,
    color: Colors.themes.provider.primary,
    marginTop: 2,
    fontWeight: "600",
  },
});
