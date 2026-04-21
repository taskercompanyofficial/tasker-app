import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useEcho } from "@/context/EchoProvider";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

const QUICK_OPTIONS = [
  "Work Order Issue",
  "Chat with Technician",
  "Billing Support",
  "Other",
];

interface Message {
  id: string;
  text?: string;
  sender: "me" | "support";
  time: string;
  image?: string;
}

export default function CustomerSupportChat() {
  const { session } = useSession();
  const { isConnected } = useEcho();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi there! How can we help you with Tasker today?",
      sender: "support",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    simulateSupportResponse();
  };

  const sendQuickOption = (option: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: option,
      sender: "me",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    simulateSupportResponse();
  };

  const sendImageMessage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: "me",
        image: result.assets[0].uri,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, newMessage]);
      simulateSupportResponse();
    }
  };

  const simulateSupportResponse = () => {
    setIsTyping(true);
    setTimeout(
      () => {
        const responses = [
          "We're looking into this right now.",
          "Could you please provide more details?",
          "Thank you for the information. We'll get back to you shortly.",
          "I understand. Let me check with my team.",
          "Please hold on for a moment while I verify.",
        ];
        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        const supportMessage: Message = {
          id: Date.now().toString(),
          text: randomResponse,
          sender: "support",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, supportMessage]);
        setIsTyping(false);
      },
      2000 + Math.random() * 2000,
    );
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageRow,
        item.sender === "me" ? styles.myMessageRow : styles.supportMessageRow,
      ]}
    >
      {item.sender === "support" && (
        <View style={styles.avatarContainer}>
          <Ionicons
            name="headset"
            size={16}
            color={Colors.themes.customer.primary}
          />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          item.sender === "me" ? styles.myBubble : styles.supportBubble,
          item.image ? styles.imageBubble : null,
        ]}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.messageImage}
            contentFit="cover"
          />
        ) : null}
        {item.text ? (
          <Text
            style={[
              styles.messageText,
              item.sender === "me"
                ? styles.myMessageText
                : styles.supportMessageText,
              item.image ? { marginTop: Spacing.xs } : null,
            ]}
          >
            {item.text}
          </Text>
        ) : null}
        <Text
          style={[
            styles.timeText,
            item.sender === "me" ? styles.myTimeText : styles.supportTimeText,
          ]}
        >
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerAvatarContainer}>
          <Ionicons
            name="headset"
            size={24}
            color={Colors.neutral.white}
            style={styles.headerAvatarIcon}
          />
          <View
            style={[
              styles.onlineIndicator,
              !isConnected && { backgroundColor: Colors.error },
            ]}
          />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Tasker Support</Text>
          <Text style={styles.headerStatus}>
            {isConnected ? "Online" : "Offline"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => Linking.openURL("tel:03041112717")}
        >
          <Ionicons name="call-outline" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.messageRow, styles.supportMessageRow]}>
                <View style={styles.avatarContainer}>
                  <Ionicons
                    name="headset"
                    size={16}
                    color={Colors.themes.customer.primary}
                  />
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.supportBubble,
                    {
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.lg,
                    },
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={Colors.themes.customer.primary}
                  />
                </View>
              </View>
            ) : null
          }
        />

        <View style={styles.quickOptionsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickOptionsScroll}
          >
            {QUICK_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickOptionChip}
                onPress={() => sendQuickOption(option)}
              >
                <Text style={styles.quickOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={sendImageMessage}
          >
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={Colors.text.secondary}
            />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor={Colors.text.tertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !input.trim() && { backgroundColor: Colors.neutral.gray[200] },
            ]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={input.trim() ? Colors.neutral.white : Colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50], // Slightly off-white background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.neutral.white,
    ...Shadows.sm,
    zIndex: 10,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  headerAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.themes.customer.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    position: "relative",
  },
  headerAvatarIcon: {
    marginLeft: 2,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  headerActionButton: {
    padding: Spacing.sm,
  },
  listContent: {
    padding: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  messageRow: {
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  supportMessageRow: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.themes.customer.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  imageBubble: {
    padding: Spacing.xs,
  },
  myBubble: {
    backgroundColor: Colors.themes.customer.primary,
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    backgroundColor: Colors.neutral.white,
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: 220,
    height: 220,
    borderRadius: BorderRadius.lg,
  },
  messageText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.neutral.white,
  },
  supportMessageText: {
    color: Colors.text.primary,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myTimeText: {
    color: Colors.neutral.white,
    opacity: 0.7,
  },
  supportTimeText: {
    color: Colors.text.tertiary,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.neutral.white,
    ...Shadows.sm,
  },
  quickOptionsWrap: {
    backgroundColor: Colors.neutral.gray[50],
    paddingBottom: Spacing.xs,
  },
  quickOptionsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quickOptionChip: {
    backgroundColor: Colors.themes.customer.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.themes.customer.primaryLight,
  },
  quickOptionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.themes.customer.primaryDark,
    fontWeight: Typography.weights.medium,
  },
  attachButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
    marginBottom: 2,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : Spacing.sm,
    marginRight: Spacing.sm,
    maxHeight: 120,
  },
  textInput: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.themes.customer.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 1,
  },
});
