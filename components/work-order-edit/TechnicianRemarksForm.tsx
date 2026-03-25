import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface TechnicianRemarksFormProps {
  value: string;
  onChangeText: (value: string) => void;
}

export default function TechnicianRemarksForm({
  value,
  onChangeText,
}: TechnicianRemarksFormProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Technician Remarks</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Enter your remarks..."
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 8,
    fontSize: 10,
    color: "#111827",
    backgroundColor: "#FAFAFA",
    minHeight: 60,
  },
});
