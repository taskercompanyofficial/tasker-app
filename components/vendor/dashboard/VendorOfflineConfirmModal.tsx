import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AppText from "@/components/common/AppText";

interface VendorOfflineConfirmModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function VendorOfflineConfirmModal({
  visible,
  loading = false,
  onClose,
  onConfirm,
}: VendorOfflineConfirmModalProps) {
  const handleCancel = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onClose();
  };

  const handleConfirm = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (_) {}
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Absolute touchable backdrop: only taps OUTSIDE the card trigger cancel */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCancel}
        />

        {/* Modal Card dialog */}
        <View style={styles.modalCard}>
          {/* Top Red Power Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="power" size={26} color="#DC2626" />
          </View>

          <AppText style={styles.modalTitle}>Go Offline?</AppText>
          <AppText style={styles.modalDescription}>
            You will stop receiving new customer job dispatches until you go back online.
          </AppText>

          {/* Status Note */}
          <View style={styles.infoNoteBox}>
            <Ionicons name="shield-checkmark-outline" size={15} color="#059669" />
            <AppText style={styles.infoNoteText}>
              Your active earnings and today's stats remain safely stored.
            </AppText>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.75}
              onPress={handleCancel}
              disabled={loading}
            >
              <AppText style={styles.cancelBtnText}>Stay Online</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.confirmRow}>
                  <Ionicons name="power" size={15} color="#FFFFFF" />
                  <AppText style={styles.confirmBtnText}>Go Offline</AppText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 22,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  infoNoteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 20,
    width: "100%",
  },
  infoNoteText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
