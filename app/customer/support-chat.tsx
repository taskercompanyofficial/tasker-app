import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { ProfileSummaryModal } from "@/components/Chat/ProfileSummaryModal";
import { ORDER_URL, WORK_ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Order } from "@/types/order";
import { AppConversationParticipant } from "@/types/chat";
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
  StatusBar,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useVoiceCall } from "@/context/VoiceCallContext";

export default function CustomerSupportChatHub({
  initialWorkOrderId: propInitialWorkOrderId,
}: {
  initialWorkOrderId?: string;
} = {}) {
  const { initiateCall } = useVoiceCall();
  const params = useLocalSearchParams<{ initialWorkOrderId?: string; id?: string }>();
  const initialId = propInitialWorkOrderId || params.initialWorkOrderId || params.id || null;
  const [activeWorkOrders, setActiveWorkOrders] = useState<Order[]>([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(initialId);

  useEffect(() => {
    const id = propInitialWorkOrderId || params.initialWorkOrderId || params.id;
    if (id) {
      setSelectedWorkOrderId(String(id));
    }
  }, [propInitialWorkOrderId, params.initialWorkOrderId, params.id]);

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
      const currentTarget = propInitialWorkOrderId || params.initialWorkOrderId || params.id;
      if (currentTarget) {
        const found = ordersList.find((o) => String(o.id) === String(currentTarget) || String(o.order_number) === String(currentTarget));
        if (found && !active.some((o) => String(o.id) === String(found.id))) {
          active.unshift(found);
        }
      }
      setActiveWorkOrders(active);
    } catch (err) {
      console.error("Failed to fetch orders for chat hub:", err);
    }
  };

  const [technicianPartner, setTechnicianPartner] = useState<AppConversationParticipant | null>(null);
  const [technicianPhone, setTechnicianPhone] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!selectedWorkOrderId) {
      setTechnicianPartner(null);
      setTechnicianPhone(null);
      return;
    }

    let isMounted = true;
    myAxios
      .get(`${WORK_ORDER_URL}/${selectedWorkOrderId}`)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data;
        const phone =
          data?.vendor_staff?.phone ||
          data?.vendor?.phone ||
          data?.assigned_to?.phone ||
          data?.extra_number ||
          null;
        if (phone) {
          setTechnicianPhone(String(phone).trim());
        }
      })
      .catch(() => {
        // Fallback or quiet ignore
      });

    return () => {
      isMounted = false;
    };
  }, [selectedWorkOrderId]);

  const isSupportDesk = !selectedWorkOrderId;
  const currentOrder = activeWorkOrders.find(
    (o) => String(o.id) === String(selectedWorkOrderId) || String(o.order_number) === String(selectedWorkOrderId)
  );

  const activePhone = (!isSupportDesk && (technicianPhone || technicianPartner?.phone))
    ? (technicianPhone || technicianPartner?.phone)!
    : "03041112717";

  const handleCall = () => {
    if (selectedWorkOrderId) {
      const targetWorkOrderId = currentOrder?.id || Number(selectedWorkOrderId);
      if (targetWorkOrderId) {
        initiateCall({
          workOrderId: Number(targetWorkOrderId),
          receiverName: technicianPartner?.display_name || "Service Technician",
          receiverAvatar: technicianPartner?.avatar_url,
          workOrderNumber: currentOrder?.order_number || String(selectedWorkOrderId),
        });
        return;
      }
    }

    const cleanPhone = activePhone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    const digits = activePhone.replace(/[^0-9]/g, "");
    const waPhone = digits.startsWith("0")
      ? `92${digits.slice(1)}`
      : digits.startsWith("92")
        ? digits
        : digits;
    Linking.openURL(`https://wa.me/${waPhone}`).catch(() => {});
  };

  const headerTitle = isSupportDesk
    ? "Tasky • AI Chat Support"
    : technicianPartner?.display_name
      ? technicianPartner.display_name
      : `Technician Chat • #${currentOrder?.order_number || selectedWorkOrderId}`;

  const headerSubtitle = isSupportDesk
    ? "⚡ Live 24/7 AI Assistant • Instant Reply"
    : technicianPartner
      ? `${technicianPartner.role || "Service Technician"} • Order #${currentOrder?.order_number || selectedWorkOrderId}`
      : "Direct Chat with Assigned Technician";

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={
          isDark ? "rgba(0, 0, 0, 0.40)" : "rgba(255, 255, 255, 0.40)"
        }
        translucent
      />
      {/* App Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Profile Info (Clickable for assigned technician) */}
        <TouchableOpacity
          style={styles.headerProfileContainer}
          onPress={() => {
            if (!isSupportDesk && technicianPartner) {
              setShowProfileModal(true);
            }
          }}
          activeOpacity={!isSupportDesk && technicianPartner ? 0.7 : 1}
        >
          <View style={styles.avatarWrapper}>
            {isSupportDesk ? (
              <Image
                source={require("@/assets/images/tasker-ai-avatar.jpg")}
                style={styles.avatarImg}
              />
            ) : technicianPartner?.avatar_url ? (
              <Image
                source={{ uri: technicianPartner.avatar_url }}
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
                {headerTitle}
              </Text>
              <MaterialCommunityIcons
                name="check-decagram"
                size={14}
                color={Colors.themes.customer.primary}
              />
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {headerSubtitle}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

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
          partnerPhone={technicianPhone || technicianPartner?.phone}
          hideHeader={true}
          onPartnerResolved={(partner) => setTechnicianPartner(partner)}
        />
      </View>

      {/* Technician Worker Profile Summary Modal */}
      <ProfileSummaryModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        partner={technicianPartner}
        phone={technicianPhone || technicianPartner?.phone}
      />
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
  headerProfileContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
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
