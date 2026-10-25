import AppText from "@/components/common/AppText";
import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { AppConversationParticipant } from "@/types/chat";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ProfileSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  partner: AppConversationParticipant | null;
  phone?: string | null;
}

export function ProfileSummaryModal({
  visible,
  onClose,
  partner,
  phone: propPhone,
}: ProfileSummaryModalProps) {
  if (!partner) return null;

  const resolvedPhone = propPhone || partner.phone || "03041112717";

  const handleCall = () => {
    const cleanPhone = resolvedPhone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    const digits = resolvedPhone.replace(/[^0-9]/g, "");
    const waPhone = digits.startsWith("0")
      ? `92${digits.slice(1)}`
      : digits.startsWith("92")
        ? digits
        : digits;
    Linking.openURL(`https://wa.me/${waPhone}`).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color="#64748B" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: Avatar, Name, Role */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                {partner.avatar_url ? (
                  <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <AppText style={styles.avatarText}>
                      {partner.display_name?.charAt(0).toUpperCase() || "T"}
                    </AppText>
                  </View>
                )}
                {partner.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <AppText style={styles.name}>{partner.display_name}</AppText>
              <View style={styles.roleBadge}>
                <AppText style={styles.roleText}>{partner.role || "Service Partner"}</AppText>
              </View>
            </View>

            {/* Quick Contact Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.contactBtn, styles.callBtn]}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <AppText style={styles.callBtnText}>Call Directly</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactBtn, styles.waBtn]}
                onPress={handleWhatsApp}
                activeOpacity={0.8}
              >
                <FontAwesome name="whatsapp" size={17} color="#FFFFFF" />
                <AppText style={styles.waBtnText}>WhatsApp</AppText>
              </TouchableOpacity>
            </View>

            {/* Minimal Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <AppText style={styles.statValue}>4.9/5</AppText>
                <AppText style={styles.statLabel}>Rating</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <AppText style={styles.statValue}>150+</AppText>
                <AppText style={styles.statLabel}>Jobs Completed</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <AppText style={[styles.statValue, { color: "#16A34A" }]}>Verified</AppText>
                <AppText style={styles.statLabel}>Tasker Pro</AppText>
              </View>
            </View>

            {/* Contact & Verification Cards */}
            <View style={styles.section}>
              <View style={styles.infoCard}>
                <Ionicons name="call-outline" size={18} color={Colors.themes.customer.primary} />
                <View style={styles.infoCardContent}>
                  <AppText style={styles.infoCardTitle}>Direct Contact Number</AppText>
                  <AppText style={styles.infoCardSubtitle}>{resolvedPhone}</AppText>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#16A34A" />
                <View style={styles.infoCardContent}>
                  <AppText style={styles.infoCardTitle}>Safety & Verification</AppText>
                  <AppText style={styles.infoCardSubtitle}>
                    CNIC verified & background checked Tasker company technician
                  </AppText>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SCREEN_HEIGHT * 0.42,
    maxHeight: SCREEN_HEIGHT * 0.78,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 18,
    zIndex: 10,
    padding: 6,
  },
  content: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F1F5F9",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.themes.customer.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  callBtn: {
    backgroundColor: Colors.themes.customer.primary,
  },
  callBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  waBtn: {
    backgroundColor: "#16A34A",
  },
  waBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  section: {
    width: "100%",
    gap: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 10,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  infoCardSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 1,
  },
});
