import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Order } from "@/types/order";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerSupportChatHub() {
  const params = useLocalSearchParams<{ initialWorkOrderId?: string }>();
  const [activeWorkOrders, setActiveWorkOrders] = useState<Order[]>([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(
    params.initialWorkOrderId || null
  );

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const res = await myAxios.get(ORDER_URL);
      const ordersList: Order[] = res.data?.data?.data || res.data?.data || [];
      // Filter active orders
      const active = ordersList.filter(
        (o) => o.status === "in_progress" || o.status === "pending" || o.status === "confirmed" || o.status === "scheduled"
      );
      setActiveWorkOrders(active);
    } catch (err) {
      console.error("Failed to fetch orders for chat hub:", err);
    }
  };

  const handleCall = () => {
    Linking.openURL("tel:03041112717").catch(() => {});
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/923041112717").catch(() => {});
  };

  const isSupportDesk = !selectedWorkOrderId;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* App Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          {isSupportDesk ? (
            <Image
              source={require("@/assets/images/tasker-ai-avatar.jpg")}
              style={styles.avatarImg}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: "#3B82F6" },
              ]}
            >
              <Ionicons
                name="construct"
                size={18}
                color="#FFFFFF"
              />
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.headerTextContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {isSupportDesk ? "Tasky • AI Chat Support" : `Order #${selectedWorkOrderId}`}
            </Text>
            <MaterialCommunityIcons
              name="check-decagram"
              size={14}
              color={Colors.themes.customer.primary}
            />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.headerSubtitle}>
              {isSupportDesk ? "⚡ Live 24/7 AI Assistant • Instant Reply" : "Direct Order Chat"}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={15} color={Colors.themes.customer.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.whatsappBtn]}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <FontAwesome name="whatsapp" size={16} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Complaints / Work Order Selector Bar if active orders exist */}
      {activeWorkOrders.length > 0 && (
        <View style={styles.selectorBar}>
          <ScrollViewHorizontalSelector
            orders={activeWorkOrders}
            selectedId={selectedWorkOrderId}
            onSelect={(id) => setSelectedWorkOrderId(id)}
          />
        </View>
      )}

      {/* Real-Time Chat Room */}
      <View style={{ flex: 1 }}>
        <ChatRoom
          key={selectedWorkOrderId || "support"}
          workOrderId={selectedWorkOrderId || undefined}
          hideHeader={true}
        />
      </View>
    </SafeAreaView>
  );
}

function ScrollViewHorizontalSelector({
  orders,
  selectedId,
  onSelect,
}: {
  orders: Order[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[{ id: null, order_number: "Tasker Support" }, ...orders]}
      keyExtractor={(item) => (item.id ? item.id.toString() : "support")}
      contentContainerStyle={styles.selectorContent}
      renderItem={({ item }) => {
        const isSupportTab = item.id === null;
        const isSelected = isSupportTab
          ? selectedId === null
          : selectedId === item.id.toString() || selectedId === item.order_number;

        return (
          <TouchableOpacity
            style={[
              styles.selectorChip,
              isSelected && styles.selectorChipSelected,
            ]}
            onPress={() =>
              onSelect(isSupportTab ? null : item.id.toString())
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSupportTab ? "sparkles" : "construct"}
              size={13}
              color={isSelected ? Colors.neutral.white : Colors.text.secondary}
            />
            <Text
              style={[
                styles.selectorText,
                isSelected && styles.selectorTextSelected,
              ]}
            >
              {isSupportTab
                ? "Tasky AI"
                : `#${item.order_number || item.id}`}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#22C55E",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  callBtn: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  whatsappBtn: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  selectorBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 8,
  },
  selectorContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  selectorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectorChipSelected: {
    backgroundColor: Colors.themes.customer.primary,
    borderColor: Colors.themes.customer.primary,
  },
  selectorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  selectorTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
