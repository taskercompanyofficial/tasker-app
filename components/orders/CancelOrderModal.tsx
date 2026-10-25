import AppTextInput from "@/components/common/AppTextInput";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CancelOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

const presetReasons = [
  "Change of plans",
  "Booked by mistake or duplicate",
  "Schedule no longer works",
  "Found alternative service",
  "Other reason",
];

export default function CancelOrderModal({
  visible,
  onClose,
  onConfirm,
  loading,
}: CancelOrderModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = width < 360;
  const modalMaxWidth = Math.min(width - 32, 420);
  const maxModalHeight = height - (insets.top + insets.bottom + 40);

  const [selectedPreset, setSelectedPreset] = useState<string>("Change of plans");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const finalReason =
      selectedPreset === "Other reason" && customReason.trim()
        ? customReason.trim()
        : customReason.trim()
        ? `${selectedPreset} - ${customReason.trim()}`
        : selectedPreset;

    onConfirm(finalReason || "Cancelled by customer");
  };

  const handleClose = () => {
    if (loading) return;
    setCustomReason("");
    setSelectedPreset("Change of plans");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              width: modalMaxWidth,
              maxHeight: maxModalHeight,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: isSmallScreen ? 14 : 20 },
            ]}
          >
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconGlow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="alert-circle" size={32} color={Colors.error} />
                </View>
              </View>
            </View>

            {/* Title & Message */}
            <AppText style={[styles.title, isSmallScreen && { fontSize: 18 }]}>
              Cancel Service Order?
            </AppText>
            <AppText style={styles.message}>
              Please let us know why you need to cancel. This helps us improve our service.
            </AppText>

            {/* Preset Reasons Chips */}
            <AppText style={styles.sectionLabel}>SELECT REASON</AppText>
            <View style={styles.presetsList}>
              {presetReasons.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.presetChip,
                    selectedPreset === r && styles.presetChipSelected,
                  ]}
                  onPress={() => setSelectedPreset(r)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPreset === r && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedPreset === r && <View style={styles.radioDot} />}
                  </View>
                  <AppText
                    style={[
                      styles.presetText,
                      selectedPreset === r && styles.presetTextSelected,
                    ]}
                  >
                    {r}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Note Input */}
            <View style={styles.inputContainer}>
              <AppText style={styles.sectionLabel}>ADDITIONAL DETAILS (OPTIONAL)</AppText>
              <AppTextInput
                style={styles.input}
                placeholder="Provide any additional comments..."
                placeholderTextColor={Colors.text.tertiary}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={2}
                maxLength={300}
                textAlignVertical="top"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.7}
              >
                <AppText style={styles.cancelButtonText}>Keep Order</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  loading && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.neutral.white} size="small" />
                ) : (
                  <>
                    <AppText style={styles.confirmButtonText}>Yes, Cancel</AppText>
                    <Ionicons name="close-circle" size={16} color={Colors.neutral.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.xs,
  },
  iconGlow: {
    padding: 6,
    borderRadius: 36,
    backgroundColor: "#FEE2E2",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 6,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: Spacing.md,
    lineHeight: 18,
    paddingHorizontal: Spacing.xs,
  },
  sectionLabel: {
    width: "100%",
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: "left",
  },
  presetsList: {
    width: "100%",
    gap: 6,
    marginBottom: Spacing.md,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetChipSelected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: Colors.error,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  presetTextSelected: {
    color: "#991B1B",
    fontWeight: "700",
  },
  inputContainer: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 56,
  },
  buttonsContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  confirmButton: {
    flex: 1.4,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.neutral.white,
  },
});
