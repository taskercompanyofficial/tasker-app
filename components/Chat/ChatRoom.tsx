import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAppChat } from "@/hooks/use-app-chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ProfileSummaryModal } from "./ProfileSummaryModal";
import { useSession } from "@/context/ctx";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface ChatRoomProps {
  workOrderId?: number | string;
  conversationId?: number | string;
}

export function ChatRoom({ workOrderId, conversationId }: ChatRoomProps) {
  const { session } = useSession();
  const { messages, loading, sending, error, sendMessage, activePartner } = useAppChat({
    workOrderId,
    conversationId,
  });
  const [showProfile, setShowProfile] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = session.user?.id;
  const currentUserType = session.appMode === 'vendor' ? 'App\\Models\\Vendor' : session.appMode === 'vendor_staff' ? 'App\\Models\\VendorStaff' : 'App\\Models\\Customer';

  // Calculate keyboard offset based on platform
  const keyboardOffset = Platform.OS === "ios" ? 88 : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.themes.customer.primary} />
        <Text style={styles.loadingText}>Connecting to secure chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardOffset}
    >
      <ChatHeader
        partner={activePartner}
        onPressProfile={() => setShowProfile(true)}
      />

      {/* Safety Banner */}
      <View style={styles.safetyBanner}>
        <Ionicons name="shield-checkmark" size={14} color="#B45309" />
        <Text style={styles.safetyText}>
          Caution: Do not deal outside the app platform for your safety.
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isSender = item.sender_id === currentUserId && item.sender_type === currentUserType;
          return <MessageBubble message={item} isSender={isSender} />;
        }}
        contentContainerStyle={styles.listContent}
        inverted
      />

      <ChatInput onSendMessage={sendMessage} sending={sending} />

      <ProfileSummaryModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        partner={activePartner}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    color: Colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  safetyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#FEF3C7",
    gap: 6,
  },
  safetyText: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "500",
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
