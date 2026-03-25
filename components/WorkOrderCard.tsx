import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WorkOrderCardProps {
  workOrderNumber: string;
  customerName: string;
  address: string;
  status: string;
  statusColor?: string;
  priority: "low" | "medium" | "high" | "urgent";
  serviceName?: string;
  createdAt?: string;
  isPendingAcceptance?: boolean;
  staffName?: string;
  onPress: () => void;
}

const PRIORITY_COLORS = {
  urgent: "#DC2626",
  high: "#D97706",
  medium: "#2563EB",
  low: "#059669",
};

export default function WorkOrderCard({
  workOrderNumber,
  customerName,
  address,
  status,
  statusColor = "#6B7280",
  priority,
  serviceName,
  createdAt,
  isPendingAcceptance = false,
  staffName,
  onPress,
}: WorkOrderCardProps) {
  const priorityColor = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isPendingAcceptance && styles.cardPending]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.workOrderNumber}>{workOrderNumber}</Text>
          <View
            style={[styles.priorityDot, { backgroundColor: priorityColor }]}
          />
        </View>

        {/* Service */}
        {serviceName && (
          <Text style={styles.serviceName} numberOfLines={1}>
            {serviceName}
          </Text>
        )}

        {/* Customer & Address */}
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={11} color="#9CA3AF" />
          <Text style={styles.infoText} numberOfLines={1}>
            {customerName}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={11} color="#9CA3AF" />
          <Text style={styles.infoText} numberOfLines={1}>
            {address}
          </Text>
        </View>

        {/* Staff Assignment */}
        {staffName && (
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={11} color="#7C3AED" />
            <Text style={[styles.infoText, { color: '#7C3AED', fontWeight: '600' }]} numberOfLines={1}>
              {staffName}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "15" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
          {createdAt && (
            <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Ionicons
        name="chevron-forward"
        size={16}
        color="#D1D5DB"
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  cardPending: {
    borderWidth: 1,
    borderColor: Colors.themes?.provider?.primary + "40" || "#1E40AF40",
  },
  accentBar: {
    width: 3,
    backgroundColor: "#6B7280",
  },
  content: {
    flex: 1,
    padding: 10,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  workOrderNumber: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: -0.2,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 10,
    color: "#6B7280",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 9,
    color: "#9CA3AF",
  },
  arrow: {
    alignSelf: "center",
    marginRight: 8,
  },
});
