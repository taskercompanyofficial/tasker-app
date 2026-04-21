import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { AppConversationParticipant } from "@/types/chat";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ProfileSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  partner: AppConversationParticipant | null;
}

export function ProfileSummaryModal({ visible, onClose, partner }: ProfileSummaryModalProps) {
  if (!partner) return null;

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
        <View style={styles.sheet}>
          <View style={styles.handle} />
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                {partner.avatar_url ? (
                  <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {partner.display_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {partner.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={20} color="#FFFFFF" />
                  </View>
                )}
              </View>
              
              <Text style={styles.name}>{partner.display_name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{partner.role || "Service Provider"}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4.9/5</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>124</Text>
                <Text style={styles.statLabel}>Jobs Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Verified</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={Colors.themes.customer.primary} />
                <Text style={styles.infoText}>Contact directly for emergencies</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="shield-outline" size={18} color={Colors.themes.customer.primary} />
                <Text style={styles.infoText}>Background checked & Identity verified</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.fullProfileButton}
              onPress={() => {
                onClose();
                // Future: router.push(`/customer/vendor/${partner.participant_id}`)
              }}
            >
              <Text style={styles.fullProfileButtonText}>View Full Profile</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: SCREEN_HEIGHT * 0.45,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  content: {
    alignItems: "center",
    paddingTop: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F3F4F6",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary + "15",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#3B82F6",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: Colors.themes.customer.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingVertical: 16,
    width: "100%",
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
  },
  section: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  fullProfileButton: {
    backgroundColor: Colors.themes.customer.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    width: "100%",
  },
  fullProfileButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
