import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EditHeaderProps {
  onInfoPress: () => void;
}

export default function EditHeader({ onInfoPress }: EditHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.headerButton}
      >
        <Ionicons name="arrow-back" size={20} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Work Order</Text>
      <TouchableOpacity onPress={onInfoPress} style={styles.headerButton}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={Colors.themes.provider.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    padding: 4,
    width: 32,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
});
