import Loader from "@/components/Loader";
import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography } from "@/constants/Styles";
import { WORK_ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Order, OrderItem } from "@/types/order";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ServiceDetailPage() {
  const { serviceId, orderNumber } = useLocalSearchParams<{ serviceId: string; orderNumber?: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await myAxios.get(`${WORK_ORDER_URL}/${orderNumber}`);
      setOrder(res.data.data);
    } catch (error) {
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const item: OrderItem | undefined = useMemo(() => {
    const idNum = Number(serviceId);
    return order?.items?.find((i) => i.id === idNum);
  }, [order, serviceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#3B82F6";
      case "assigned":
        return "#06B6D4";
      case "scheduled":
        return "#8B5CF6";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return Colors.error;
      default:
        return Colors.text.secondary;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading || refreshing) {
    return <Loader fullScreen />;
  }

  if (!order || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Service not found</Text>
          <Text style={styles.errorText}>The requested service could not be loaded.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color={Colors.themes.customer.primary} />
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.parentService?.name || "Service"}</Text>
              <Text style={styles.serviceMeta}>Quantity: {item.quantity}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "15" }]}>
              <Ionicons name="ellipse" size={10} color={getStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={16} color={Colors.text.tertiary} />
            <Text style={styles.rowText}>
              {formatDate(item.scheduled_date)} at {formatTime(item.scheduled_time)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Unit Price</Text>
            <Text style={styles.priceValue}>₨{Math.round(item.unit_price || item.subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₨{Math.round(item.subtotal)}</Text>
          </View>
        </View>

        {item.parentService && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{item.parentService.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{item.parentService.description || "-"}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.stepperColumn}>
            {["pending", "assigned", "in_progress", "completed", "closed"].map((s, idx, arr) => {
              const currentIdx =
                item.status === "assigned"
                  ? 1
                  : item.status === "in_progress"
                  ? 2
                  : item.status === "completed"
                  ? 3
                  : item.status === "cancelled"
                  ? 4
                  : 0;
              const isDone = idx <= currentIdx;
              const isActive = idx === currentIdx;
              const label =
                s === "pending"
                  ? "Pending"
                  : s === "assigned"
                  ? "Worker Assigned"
                  : s === "in_progress"
                  ? "In Progress"
                  : s === "completed"
                  ? "Completed"
                  : "Closed";
              return (
                <View key={s} style={styles.stepColumnItem}>
                  <View style={styles.stepColumnLeft}>
                    <View
                      style={[
                        styles.stepCircle,
                        isDone && { backgroundColor: Colors.themes.customer.primary },
                        isActive && { borderColor: Colors.themes.customer.primary },
                      ]}
                    >
                      <Ionicons
                        name={isDone ? "checkmark" : "ellipse-outline"}
                        size={10}
                        color={isDone ? Colors.neutral.white : Colors.text.secondary}
                      />
                    </View>
                    {idx < arr.length - 1 && (
                      <View
                        style={[
                          styles.stepConnectorVertical,
                          isDone && { backgroundColor: Colors.themes.customer.primary },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabelSmall,
                      isActive && { color: Colors.themes.customer.primary, fontWeight: "700" },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={{ height: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    margin: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  serviceInfo: {
    flex: 1,
    gap: 2,
  },
  serviceName: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  serviceMeta: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stepperColumn: {
    flexDirection: "column",
    gap: Spacing.xs,
  },
  stepColumnItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  stepColumnLeft: {
    width: 20,
    alignItems: "center",
  },
  stepCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border.light,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
  },
  stepConnectorVertical: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border.light,
    marginTop: 2,
    marginBottom: 2,
  },
  stepLabelSmall: {
    fontSize: 10,
    color: Colors.text.secondary,
    maxWidth: 140,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    flex: 1,
  },
  infoValue: {
    fontSize: 11,
    color: Colors.text.secondary,
    flex: 2,
    textAlign: "right",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
  },
});
