import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Linking } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import { AppConversationParticipant } from "@/types/chat";
import { useSession } from "@/context/ctx";
import { useVoiceCall } from "@/context/VoiceCallContext";

interface ChatHeaderProps {
  partner: AppConversationParticipant | null;
  partnerPhone?: string | null;
  workOrderId?: number | string;
  onPressProfile?: () => void;
  isSupport?: boolean;
}

export function ChatHeader({
  partner,
  partnerPhone,
  workOrderId,
  onPressProfile,
  isSupport = false,
}: ChatHeaderProps) {
  const { session } = useSession();
  const { initiateCall } = useVoiceCall();
  const isVendor = session.appMode === "vendor" || session.appMode === "vendor_staff";
  const primaryThemeColor = isVendor
    ? Colors.themes.provider.primary
    : Colors.themes.customer.primary;

  const displayName = isSupport
    ? (isVendor ? "Tasker Vendor Helpdesk" : "Tasky • AI Assistant")
    : partner?.display_name || (isVendor ? "Customer" : "Service Partner");

  const subtitle = isSupport
    ? "⚡ Instant AI Support • 24/7"
    : partner?.role
      ? `${partner.role} • Active`
      : (isVendor ? "Order Customer" : "Assigned Service Partner");

  const resolvedPhone = (!isSupport && (partnerPhone || partner?.phone))
    ? (partnerPhone || partner?.phone)!
    : "03041112717";

  const handleCall = () => {
    if (workOrderId) {
      initiateCall({
        workOrderId: Number(workOrderId),
        receiverName: displayName,
        receiverAvatar: partner?.avatar_url,
      });
      return;
    }

    const cleanPhone = resolvedPhone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanPhone}`).catch((err) =>
      console.warn("Cannot dial phone:", err)
    );
  };

  const handleWhatsApp = () => {
    const digits = resolvedPhone.replace(/[^0-9]/g, "");
    const waPhone = digits.startsWith("0")
      ? `92${digits.slice(1)}`
      : digits.startsWith("92")
        ? digits
        : digits;
    Linking.openURL(`https://wa.me/${waPhone}`).catch((err) =>
      console.warn("Cannot open WhatsApp:", err)
    );
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <DirectionalIcon name="chevron-back" size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.profileContainer}
        onPress={onPressProfile}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          {isSupport ? (
            <Image
              source={require("@/assets/images/tasker-ai-avatar.jpg")}
              style={styles.avatar}
            />
          ) : partner?.avatar_url ? (
            <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: primaryThemeColor },
              ]}
            >
              <Ionicons
                name={isVendor ? "person" : "construct"}
                size={18}
                color="#FFFFFF"
              />
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <AppText style={styles.name} numberOfLines={1}>
              {displayName}
            </AppText>
            <MaterialCommunityIcons
              name="check-decagram"
              size={15}
              color={primaryThemeColor}
              style={styles.verifiedIcon}
            />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <AppText style={styles.statusText}>{subtitle}</AppText>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={16} color={primaryThemeColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={handleWhatsApp}
          activeOpacity={0.7}
        >
          <FontAwesome name="whatsapp" size={17} color="#25D366" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginRight: 6,
  },
  profileContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
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
  infoContainer: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  verifiedIcon: {
    marginTop: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#22C55E",
  },
  statusText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  callButton: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  whatsappButton: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
});

