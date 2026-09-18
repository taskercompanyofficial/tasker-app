import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAppChat } from "@/hooks/use-app-chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ProfileSummaryModal } from "./ProfileSummaryModal";
import { useSession } from "@/context/ctx";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatRoomProps {
  workOrderId?: number | string;
  conversationId?: number | string;
  hideHeader?: boolean;
  onPressProfile?: () => void;
}

export function ChatRoom({
  workOrderId,
  conversationId,
  hideHeader = false,
  onPressProfile,
}: ChatRoomProps) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { messages, loading, sending, error, sendMessage, activePartner } = useAppChat({
    workOrderId,
    conversationId,
  });
  const [showProfile, setShowProfile] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = session.user?.id;
  const currentUserType = session.appMode === 'vendor' ? 'App\\Models\\Vendor' : session.appMode === 'vendor_staff' ? 'App\\Models\\VendorStaff' : 'App\\Models\\Customer';
  const isSupport = !workOrderId;

  // Calculate dynamic keyboard offset
  const keyboardOffset = Platform.OS === "ios" ? (hideHeader ? 0 : insets.top) : 0;

  const handleQuickAction = (_actionId: string, label: string) => {
    sendMessage("text", label);
  };

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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      {!hideHeader && (
        <ChatHeader
          partner={activePartner}
          onPressProfile={onPressProfile || (() => setShowProfile(true))}
          isSupport={isSupport}
        />
      )}

      {/* Safety Banner for order conversations */}
      {!isSupport && (
        <View style={styles.safetyBanner}>
          <Ionicons name="shield-checkmark" size={14} color="#B45309" />
          <Text style={styles.safetyText}>
            Caution: Do not deal outside the app platform for your safety.
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isSender = item.sender_id === currentUserId && item.sender_type === currentUserType;
          return (
            <MessageBubble
              message={item}
              isSender={isSender}
              onSelectQuickReply={handleQuickAction}
            />
          );
        }}
        ListHeaderComponent={
          sending && isSupport ? (
            <View style={styles.typingIndicatorWrapper}>
              <View style={styles.typingBubble}>
                <Image
                  source={require("@/assets/images/tasker-ai-avatar.jpg")}
                  style={styles.typingAvatar}
                />
                <ActivityIndicator size="small" color={Colors.themes.customer.primary} />
                <Text style={styles.typingText}>Tasky is typing...</Text>
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={
          isSupport ? (
            <View style={styles.welcomeHeroCard}>
              <Image
                source={require("@/assets/images/tasker-ai-avatar.jpg")}
                style={styles.welcomeHeroAvatar}
              />
              <View style={styles.welcomeHeroTitleRow}>
                <Text style={styles.welcomeHeroTitle}>Meet Tasky</Text>
                <View style={styles.aiPillBadge}>
                  <Text style={styles.aiPillText}>AI ASSISTANT</Text>
                </View>
              </View>
              <Text style={styles.welcomeHeroSubtitle}>
                Hello! I'm here 24/7 to help you book services, track orders, find discounts, or troubleshoot repair problems.
              </Text>
              <View style={styles.disclaimerBox}>
                <Ionicons name="information-circle-outline" size={13} color="#64748B" style={{ marginTop: 1 }} />
                <Text style={styles.disclaimerBoxText}>
                  Tasky uses AI and can make mistakes. Verify important info or call our 24/7 helpline anytime.
                </Text>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        inverted
      />

      <ChatInput
        onSendMessage={sendMessage}
        sending={sending}
        onQuickAction={handleQuickAction}
        showSuggestions={isSupport}
      />

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
  typingIndicatorWrapper: {
    alignSelf: "flex-start",
    marginVertical: 4,
    marginLeft: 4,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  typingAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  typingText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  welcomeHeroCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeHeroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.themes.customer.primary,
  },
  welcomeHeroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  welcomeHeroTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  aiPillBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  aiPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
    letterSpacing: 0.5,
  },
  welcomeHeroSubtitle: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 6,
  },
  disclaimerBoxText: {
    fontSize: 11,
    color: "#64748B",
    flex: 1,
    lineHeight: 15,
  },
});
