import Button from "@/components/Button";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { modalStyles } from "./styles";

interface ReasonModalProps {
  visible: boolean;
  title: string;
  message: string;
  placeholder: string;
  confirmText: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ReasonModal({
  visible,
  title,
  message,
  placeholder,
  confirmText,
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");

  if (!visible) return null;

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.container}>
        <Text style={modalStyles.title}>{title}</Text>
        <Text style={modalStyles.message}>{message}</Text>
        <TextInput
          style={modalStyles.textInput}
          placeholder={placeholder}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          autoFocus
        />
        <View style={modalStyles.actions}>
          <View style={modalStyles.buttonContainer}>
            <Button
              title={cancelText}
              onPress={handleCancel}
              variant="outline"
              size="medium"
              fullWidth
            />
          </View>
          <View style={modalStyles.buttonContainer}>
            <Button
              title={confirmText}
              onPress={handleConfirm}
              variant="primary"
              size="medium"
              fullWidth
              loading={loading}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
