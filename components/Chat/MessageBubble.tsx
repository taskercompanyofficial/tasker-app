import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import React, { useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { AppMessage } from "@/types/chat";
import { VoiceMessage } from "./VoiceMessage";
import { VideoMessage } from "./VideoMessage";
import { LocationMessage } from "./LocationMessage";
import { DocumentMessage } from "./DocumentMessage";
import Colors from "@/constants/Colors";
import getImageUrl from "@/lib/utils";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

interface MessageBubbleProps {
  message: AppMessage;
  isSender: boolean;
  onSelectQuickReply?: (actionId: string, label: string) => void;
}

export function MessageBubble({ message, isSender, onSelectQuickReply }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const metadata = message.metadata || {};
  const orderCards = metadata.order_cards || [];
  const quickReplies = metadata.quick_replies || [];
  const isBot = metadata.is_bot === true;

  const handleLongPress = async () => {
    if (message.content && message.type === "text") {
      await Clipboard.setStringAsync(message.content);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleQuickReply = (qr: {
    id: string;
    label: string;
    action?: string;
    route?: string;
    url?: string;
    order_number?: string;
  }) => {
    if (qr.url) {
      Linking.openURL(qr.url).catch(() => {});
      return;
    }
    if (qr.route) {
      router.push(qr.route as any);
      return;
    }
    if (qr.action === "call_helpline") {
      Linking.openURL("tel:03041112717").catch(() => {});
      return;
    }
    if (qr.action === "open_whatsapp") {
      Linking.openURL("https://wa.me/923041112717").catch(() => {});
      return;
    }
    if (qr.action === "book_service") {
      router.push("/customer/(tabs)/services" as any);
      return;
    }
    if (qr.action === "active_orders" || qr.action === "view_orders") {
      router.push("/customer/(tabs)/orders" as any);
      return;
    }
    if (qr.action === "view_wallet") {
      router.push("/customer/(tabs)/wallet" as any);
      return;
    }
    if (qr.action === "commercial_quote") {
      router.push("/customer/commercial-quote" as any);
      return;
    }
    if (qr.action === "free_installation") {
      router.push("/customer/free-installation" as any);
      return;
    }
    if (qr.action === "order_details" && qr.order_number) {
      router.push(`/customer/orders/${qr.order_number}` as any);
      return;
    }
    if (onSelectQuickReply) {
      onSelectQuickReply(qr.id, qr.label);
    }
  };

  const renderContent = () => {
    switch (message.type) {
      case "text":
        return (
          <AppText style={[styles.text, isSender ? styles.senderText : styles.receiverText]}>
            {message.content}
          </AppText>
        );
      case "image":
        return (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: getImageUrl(message.media_path!) }}
              style={styles.image}
              resizeMode="cover"
            />
            {message.content ? (
              <AppText style={[styles.caption, isSender ? styles.senderText : styles.receiverText]}>
                {message.content}
              </AppText>
            ) : null}
          </View>
        );
      case "video":
        return <VideoMessage uri={getImageUrl(message.media_path!)} />;
      case "audio":
        return <VoiceMessage uri={getImageUrl(message.media_path!)} isSender={isSender} />;
      case "location":
        const { latitude, longitude, label } = metadata;
        return <LocationMessage latitude={latitude} longitude={longitude} label={label} />;
      case "document":
        return (
          <DocumentMessage
            uri={getImageUrl(message.media_path!)}
            name={metadata.file_name || "File"}
            size={metadata.file_size}
          />
        );
      default:
        return <AppText style={styles.text}>[Unsupported Message Type]</AppText>;
    }
  };

  return (
    <View style={[styles.wrapper, isSender ? styles.senderWrapper : styles.receiverWrapper]}>
      {!isSender && (
        <View style={styles.senderHeader}>
          {isBot ? (
            <View style={styles.botTag}>
              <Image
                source={require("@/assets/images/tasker-ai-avatar.jpg")}
                style={styles.botAvatarMini}
              />
              <AppText style={styles.botTagText}>Tasky AI</AppText>
              <Ionicons name="sparkles" size={9} color={Colors.themes.customer.primary} />
            </View>
          ) : (
            <AppText style={styles.senderName}>{message.sender?.name || "Support"}</AppText>
          )}
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={[
          styles.bubble,
          isSender ? styles.senderBubble : styles.receiverBubble,
          (message.type === "location" || message.type === "video" || message.type === "image") &&
            styles.mediaBubble,
        ]}
      >
        {renderContent()}

        {/* Structured Order Cards (Minimal, Sleek) */}
        {orderCards.length > 0 && (
          <View style={styles.orderCardsContainer}>
            {orderCards.map((card: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/customer/orders/${card.order_number}` as any)}
              >
                <View style={styles.orderCardHeader}>
                  <View style={styles.orderCardTitleRow}>
                    <Ionicons name="receipt-outline" size={13} color={Colors.themes.customer.primary} />
                    <AppText style={styles.orderCardNumber}>#{card.order_number}</AppText>
                  </View>
                  <View
                    style={[
                      styles.orderCardStatusBadge,
                      { backgroundColor: (card.status_color || "#22C55E") + "18" },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.orderCardStatusText,
                        { color: card.status_color || "#16A34A" },
                      ]}
                    >
                      {card.status}
                    </AppText>
                  </View>
                </View>

                <AppText style={styles.orderCardService}>{card.service_name}</AppText>

                <View style={styles.orderCardMetaRow}>
                  <View style={styles.orderCardMetaItem}>
                    <Ionicons name="calendar-outline" size={11} color="#64748B" />
                    <AppText style={styles.orderCardMetaText}>
                      {card.date} {card.time ? `• ${card.time}` : ""}
                    </AppText>
                  </View>
                  {card.technician && card.technician !== "Pending Assignment" && (
                    <View style={styles.orderCardMetaItem}>
                      <Ionicons name="person-outline" size={11} color="#64748B" />
                      <AppText style={styles.orderCardMetaText}>{card.technician}</AppText>
                    </View>
                  )}
                </View>

                <View style={styles.orderCardAction}>
                  <AppText style={styles.orderCardActionText}>Track Order</AppText>
                  <DirectionalIcon name="chevron-forward" size={12} color={Colors.themes.customer.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timestamp & Status footer */}
        <View style={styles.footer}>
          {copied && (
            <View style={styles.copiedPill}>
              <AppText style={styles.copiedPillText}>Copied</AppText>
            </View>
          )}

          <AppText style={[styles.time, isSender ? styles.senderTime : styles.receiverTime]}>
            {message.created_at
              ? new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </AppText>

          {isSender && (
            <View style={styles.statusTicks}>
              {message.status === "read" || message.is_read ? (
                <MaterialCommunityIcons name="check-all" size={14} color="#93C5FD" />
              ) : message.status === "delivered" || message.delivered_at ? (
                <MaterialCommunityIcons name="check-all" size={14} color="rgba(255,255,255,0.7)" />
              ) : (
                <MaterialCommunityIcons name="check" size={14} color="rgba(255,255,255,0.7)" />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Quick Reply Action Chips */}
      {quickReplies.length > 0 && (
        <View style={styles.quickRepliesWrap}>
          {quickReplies.map((qr: any, qIdx: number) => (
            <TouchableOpacity
              key={qIdx}
              style={styles.quickReplyChip}
              onPress={() => handleQuickReply(qr)}
              activeOpacity={0.7}
            >
              <AppText style={styles.quickReplyChipText}>{qr.label}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 3,
    maxWidth: "86%",
  },
  senderWrapper: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  receiverWrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  senderHeader: {
    marginBottom: 2,
    marginLeft: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  botTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  botAvatarMini: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  botTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
  },
  senderBubble: {
    backgroundColor: Colors.themes.customer.primary,
    borderColor: Colors.themes.customer.primary,
    borderBottomRightRadius: 3,
  },
  receiverBubble: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderBottomLeftRadius: 3,
  },
  mediaBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  mediaContainer: {
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: 220,
    height: 160,
    borderRadius: 8,
  },
  caption: {
    marginTop: 5,
    fontSize: 13,
  },
  text: {
    fontSize: 14,
    lineHeight: 19,
  },
  senderText: {
    color: "#FFFFFF",
    fontWeight: "400",
  },
  receiverText: {
    color: "#0F172A",
    fontWeight: "400",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 3,
  },
  time: {
    fontSize: 10,
  },
  senderTime: {
    color: "rgba(255,255,255,0.75)",
  },
  receiverTime: {
    color: "#94A3B8",
  },
  statusTicks: {
    marginLeft: 2,
  },
  copiedPill: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginRight: 4,
  },
  copiedPillText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  // Minimal Order Card Styles
  orderCardsContainer: {
    marginTop: 6,
    gap: 6,
  },
  orderCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  orderCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  orderCardNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  orderCardStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  orderCardStatusText: {
    fontSize: 9,
    fontWeight: "700",
  },
  orderCardService: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  orderCardMetaRow: {
    gap: 2,
    marginBottom: 6,
  },
  orderCardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  orderCardMetaText: {
    fontSize: 10,
    color: "#64748B",
  },
  orderCardAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 4,
  },
  orderCardActionText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  // Quick Replies Styles
  quickRepliesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  quickReplyChip: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  quickReplyChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
  },
});
