import AppText from "@/components/common/AppText";
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { useAppChat } from "@/hooks/use-app-chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";
import { ProfileSummaryModal } from "./ProfileSummaryModal";
import { ChatWallpaperTexture } from "./ChatWallpaperTexture";
import { useSession } from "@/context/ctx";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppConversationParticipant } from "@/types/chat";

interface ChatRoomProps {
  workOrderId?: number | string;
  conversationId?: number | string;
  partnerPhone?: string | null;
  hideHeader?: boolean;
  onPressProfile?: () => void;
  keyboardVerticalOffset?: number;
  onPartnerResolved?: (partner: AppConversationParticipant | null) => void;
}

export function ChatRoom({
  workOrderId,
  conversationId,
  partnerPhone,
  hideHeader = false,
  onPressProfile,
  keyboardVerticalOffset: customKeyboardOffset,
  onPartnerResolved,
}: ChatRoomProps) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { messages, loading, sending, error, sendMessage, activePartner } = useAppChat({
    workOrderId,
    conversationId,
  });
  const [showProfile, setShowProfile] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const containerRef = useRef<View>(null);
  const [measuredOffset, setMeasuredOffset] = useState<number | null>(null);

  const currentUserId = session.user?.id;
  const currentUserType =
    session.appMode === "vendor"
      ? "App\\Models\\Vendor"
      : session.appMode === "vendor_staff"
        ? "App\\Models\\VendorStaff"
        : "App\\Models\\Customer";
  const isSupport = !workOrderId;

  useEffect(() => {
    if (onPartnerResolved) {
      onPartnerResolved(activePartner);
    }
  }, [activePartner, onPartnerResolved]);

  // Dynamically measure the exact absolute top coordinate of the chat container in the window
  const measureOffset = useCallback(() => {
    containerRef.current?.measureInWindow((_x, y) => {
      if (typeof y === "number" && !isNaN(y) && y >= 0) {
        setMeasuredOffset(y);
      }
    });
  }, []);

  // Compute effective keyboard vertical offset
  const fallbackOffset = hideHeader
    ? insets.top + (isSupport ? 60 : 50)
    : Platform.OS === "ios"
      ? insets.top
      : 0;
  const effectiveOffset =
    customKeyboardOffset ?? (measuredOffset !== null ? measuredOffset : fallbackOffset);

  const handleQuickAction = (_actionId: string, label: string) => {
    sendMessage("text", label);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.themes.customer.primary} />
        <AppText style={styles.loadingText}>Connecting to secure chat...</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <AppText style={styles.errorText}>{error}</AppText>
      </View>
    );
  }

  const isVendor = session.appMode === "vendor" || session.appMode === "vendor_staff";

  return (
    <View ref={containerRef} style={styles.container} onLayout={measureOffset}>
      {/* Background Wallpaper Pattern Texture */}
      <ChatWallpaperTexture />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={effectiveOffset}
      >
        {!hideHeader && (
          <ChatHeader
            partner={activePartner}
            partnerPhone={partnerPhone}
            workOrderId={workOrderId}
            onPressProfile={onPressProfile || (() => setShowProfile(true))}
            isSupport={isSupport}
          />
        )}

        {/* Minimal Safety Pill Banner for order conversations */}
        {!isSupport && (
          <View style={styles.safetyBanner}>
            <Ionicons name="shield-checkmark" size={13} color="#D97706" />
            <AppText style={styles.safetyText} numberOfLines={1}>
              {isVendor
                ? "Deal only via Tasker app for verified commission & warranty protection."
                : "Deal only via Tasker app for your warranty & security protection."}
            </AppText>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          onScroll={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y;
            setShowScrollToBottom(offsetY > 180);
          }}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            const isSender =
              item.sender_id === currentUserId && item.sender_type === currentUserType;
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
                  <AppText style={styles.typingText}>
                    {isVendor ? "Tasker Helpdesk is typing..." : "Tasky is typing..."}
                  </AppText>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            isSupport ? (
              <View style={styles.welcomeMinimalCard}>
                <Image
                  source={require("@/assets/images/tasker-ai-avatar.jpg")}
                  style={styles.welcomeMinimalAvatar}
                />
                <View style={styles.aiPillBadge}>
                  <AppText style={styles.aiPillText}>
                    {isVendor ? "VENDOR PARTNER SUPPORT" : "24/7 AI SUPPORT"}
                  </AppText>
                </View>
                <AppText style={styles.welcomeMinimalTitle}>
                  {isVendor ? "Vendor Operations Helpdesk" : "How can we help today?"}
                </AppText>
                <AppText style={styles.welcomeMinimalSubtitle}>
                  {isVendor
                    ? "Ask any question about your assigned jobs, commissions, completion steps, or policies."
                    : "Ask any question about services, active orders, or pricing."}
                </AppText>
              </View>
            ) : (
              <View style={styles.orderStartMinimal}>
                <View style={styles.orderEncryptedBadge}>
                  <Ionicons name="lock-closed" size={11} color="#64748B" />
                  <AppText style={styles.orderEncryptedText}>
                    Order #{workOrderId} • End-to-end encrypted
                  </AppText>
                </View>
                <AppText style={styles.orderEncryptedHint}>
                  {isVendor
                    ? "Tap the top header to view customer profile, call, or open WhatsApp"
                    : "Tap the top profile header to view technician credentials & call"}
                </AppText>
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
          inverted
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />

        {/* Floating Scroll to Bottom Button */}
        {showScrollToBottom && (
          <TouchableOpacity
            style={styles.scrollToBottomBtn}
            onPress={scrollToBottom}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-down" size={18} color="#1E293B" />
          </TouchableOpacity>
        )}

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
          phone={partnerPhone}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardAvoidingView: {
    flex: 1,
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
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 8,
    gap: 6,
  },
  safetyText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "500",
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    paddingVertical: 7,
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
  // Minimal Welcome Card for Support
  welcomeMinimalCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  welcomeMinimalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.themes.customer.primary,
  },
  aiPillBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: 6,
  },
  aiPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
    letterSpacing: 0.5,
  },
  welcomeMinimalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  welcomeMinimalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 16,
  },
  // Minimal Order Start Notice
  orderStartMinimal: {
    alignItems: "center",
    marginVertical: 14,
    gap: 4,
  },
  orderEncryptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderEncryptedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  orderEncryptedHint: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
  },
  // Floating Scroll-To-Bottom
  scrollToBottomBtn: {
    position: "absolute",
    right: 14,
    bottom: 60,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 20,
  },
});
