import AppText from "@/components/common/AppText";
import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DocumentMessageProps {
  uri: string;
  name: string;
  size?: number | string;
}

export function DocumentMessage({ uri, name, size }: DocumentMessageProps) {
  const openDocument = () => {
    Linking.openURL(uri);
  };

  const formatSize = (bytes: any) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <TouchableOpacity onPress={openDocument} style={styles.container} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name="document-text" size={32} color="#4B5563" />
      </View>
      <View style={styles.info}>
        <AppText style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        {size && <AppText style={styles.size}>{formatSize(size)}</AppText>}
      </View>
      <Ionicons name="download-outline" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxWidth: 250,
  },
  iconContainer: {
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  size: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
});
