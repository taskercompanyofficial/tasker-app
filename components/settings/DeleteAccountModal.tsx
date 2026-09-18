import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  loading?: boolean;
}

export default function DeleteAccountModal({
  visible,
  onClose,
  onConfirmDelete,
  loading = false,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText.trim().toUpperCase() === "DELETE";

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalCard}>
              {/* Header Danger Icon */}
              <View style={styles.iconCircle}>
                <Ionicons name="trash-outline" size={28} color={Colors.error} />
              </View>

              <Text style={styles.title}>Delete Account?</Text>

              <Text style={styles.warningBoxText}>
                ⚠️ This action is <Text style={styles.boldText}>permanent</Text> and cannot be undone. All your orders, active requests, saved addresses, and personal profile data will be permanently wiped.
              </Text>

              {/* Confirmation Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Type <Text style={styles.deleteKeyword}>DELETE</Text> to confirm:
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type DELETE"
                  placeholderTextColor={Colors.text.tertiary}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  autoCapitalize="characters"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.deleteBtn,
                    (!isConfirmed || loading) && styles.disabledBtn,
                  ]}
                  onPress={onConfirmDelete}
                  disabled={!isConfirmed || loading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-bin" size={16} color={Colors.neutral.white} />
                  <Text style={styles.deleteBtnText}>
                    {loading ? "Deleting..." : "Delete Permanently"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Keep Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadows.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.error + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  warningBoxText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
    backgroundColor: Colors.error + "08",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error + "20",
    marginBottom: Spacing.md,
  },
  boldText: {
    fontWeight: "700",
    color: Colors.error,
  },
  inputContainer: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  deleteKeyword: {
    fontWeight: "800",
    color: Colors.error,
  },
  textInput: {
    width: "100%",
    height: 44,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.error,
    backgroundColor: Colors.neutral.gray[50],
  },
  actionsRow: {
    width: "100%",
    gap: Spacing.xs,
  },
  deleteBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.error,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  disabledBtn: {
    backgroundColor: Colors.neutral.gray[300],
    elevation: 0,
  },
  deleteBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  cancelBtn: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
});
