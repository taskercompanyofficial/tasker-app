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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'support';
  timestamp: string;
}

export default function SupportChatScreen() {
  const { session } = useSession();
  const { isConnected } = useEcho();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can we help you today?',
      sender: 'support',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simulate support response
    setTimeout(() => {
        const supportResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: "Thanks for your message. An agent will be with you shortly.",
            sender: 'support',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, supportResponse]);
    }, 1500);
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageWrapper,
      item.sender === 'me' ? styles.myMessageWrapper : styles.supportMessageWrapper
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'me' ? styles.myMessageBubble : styles.supportMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'me' ? styles.myMessageText : styles.supportMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          item.sender === 'me' ? styles.myTimestamp : styles.supportTimestamp
        ]}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Tasker Support</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.success : Colors.error }]} />
            <Text style={styles.headerSubtitle}>{isConnected ? 'Active' : 'Connecting...'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call-outline" size={20} color={Colors.themes.provider.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.text.tertiary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={Colors.neutral.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    backgroundColor: Colors.neutral.white,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 10,
    color: Colors.text.secondary,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.themes.provider.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: Spacing.md,
  },
  messageWrapper: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  supportMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  myMessageBubble: {
    backgroundColor: Colors.themes.provider.primary,
    borderBottomRightRadius: 2,
  },
  supportMessageBubble: {
    backgroundColor: Colors.neutral.gray[100],
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  myMessageText: {
    color: Colors.neutral.white,
  },
  supportMessageText: {
    color: Colors.text.primary,
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: Colors.neutral.white + '80',
  },
  supportTimestamp: {
    color: Colors.text.tertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.neutral.white,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 13,
    color: Colors.text.primary,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.themes.provider.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutral.gray[300],
  },
});
