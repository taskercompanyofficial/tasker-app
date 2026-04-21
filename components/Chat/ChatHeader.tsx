import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import { AppConversationParticipant } from "@/types/chat";

interface ChatHeaderProps {
  partner: AppConversationParticipant | null;
  onPressProfile?: () => void;
}

export function ChatHeader({ partner, onPressProfile }: ChatHeaderProps) {
  if (!partner) return null;

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.profileContainer} 
        onPress={onPressProfile}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          {partner.avatar_url ? (
            <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {partner.display_name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {partner.display_name}
            </Text>
            {partner.is_verified && (
              <MaterialCommunityIcons name="check-decagram" size={16} color="#3B82F6" style={styles.verifiedIcon} />
            )}
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
  },
  backButton: {
    padding: 3,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary + "15",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  infoContainer: {
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    maxWidth: 170,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  statusRow: {
    marginTop: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 3,
  },
});
