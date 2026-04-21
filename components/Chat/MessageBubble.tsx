import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { AppMessage } from "@/types/chat";
import { VoiceMessage } from "./VoiceMessage";
import { VideoMessage } from "./VideoMessage";
import { LocationMessage } from "./LocationMessage";
import { DocumentMessage } from "./DocumentMessage";
import Colors from "@/constants/Colors";
import getImageUrl from "@/lib/utils";

interface MessageBubbleProps {
  message: AppMessage;
  isSender: boolean;
}

export function MessageBubble({ message, isSender }: MessageBubbleProps) {
  const renderContent = () => {
    switch (message.type) {
      case "text":
        return (
          <Text style={[styles.text, isSender ? styles.senderText : styles.receiverText]}>
            {message.content}
          </Text>
        );
      case "image":
        return (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: getImageUrl(message.media_path!) }}
              style={styles.image}
              resizeMode="cover"
            />
            {message.content && (
              <Text style={[styles.caption, isSender ? styles.senderText : styles.receiverText]}>
                {message.content}
              </Text>
            )}
          </View>
        );
      case "video":
        return <VideoMessage uri={getImageUrl(message.media_path!)} />;
      case "audio":
        return <VoiceMessage uri={getImageUrl(message.media_path!)} isSender={isSender} />;
      case "location":
        const { latitude, longitude, label } = message.metadata || {};
        return <LocationMessage latitude={latitude} longitude={longitude} label={label} />;
      case "document":
        return (
          <DocumentMessage
            uri={getImageUrl(message.media_path!)}
            name={message.metadata?.file_name || "File"}
            size={message.metadata?.file_size}
          />
        );
      default:
        return <Text style={styles.text}>[Unsupported Message Type]</Text>;
    }
  };

  return (
    <View style={[styles.wrapper, isSender ? styles.senderWrapper : styles.receiverWrapper]}>
      {!isSender && message.sender && (
        <Text style={styles.senderName}>{message.sender.name}</Text>
      )}
      <View style={[
        styles.bubble,
        isSender ? styles.senderBubble : styles.receiverBubble,
        (message.type === 'location' || message.type === 'video' || message.type === 'image') && styles.mediaBubble
      ]}>
        {renderContent()}
        <View style={styles.footer}>
          <Text style={[styles.time, isSender ? styles.senderTime : styles.receiverTime]}>
             {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
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
  bubble: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
  },
  senderBubble: {
    backgroundColor: Colors.themes.customer.primary,
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  mediaBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 19,
  },
  senderText: {
    color: "#FFFFFF",
  },
  receiverText: {
    color: "#1F2937",
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 8,
  },
  caption: {
    marginTop: 4,
    paddingHorizontal: 4,
    fontSize: 13,
  },
  senderName: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 2,
    marginLeft: 4,
  },
  footer: {
    marginTop: 1,
    alignItems: "flex-end",
  },
  time: {
    fontSize: 8,
  },
  senderTime: {
    color: "rgba(255,255,255,0.7)",
  },
  receiverTime: {
    color: "#9CA3AF",
  },
});
