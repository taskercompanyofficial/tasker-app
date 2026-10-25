import AppText from "@/components/common/AppText";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ScheduleModalProps {
  visible: boolean;
  loading?: boolean;
  onConfirm: (date: string, time: string, remarks: string) => void;
  onCancel: () => void;
}

export default function ScheduleModal({
  visible,
  loading,
  onConfirm,
  onCancel,
}: ScheduleModalProps) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [remarks, setRemarks] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleConfirm = () => {
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = time.toTimeString().split(" ")[0].substring(0, 5); // HH:mm
    onConfirm(dateStr, timeStr, remarks);
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (t: Date) => {
    return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <AppText style={styles.title}>Schedule Appointment</AppText>
              <AppText style={styles.subtitle}>Set date and time for service</AppText>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              style={styles.closeBtn}
            >
              <Ionicons
                name="close"
                size={20}
                color={Colors.neutral.gray[400]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                </View>
                <View>
                  <AppText style={styles.pickerLabel}>Date</AppText>
                  <AppText style={styles.pickerValue}>{formatDate(date)}</AppText>
                </View>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => setShowTimePicker(true)}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: Colors.warning + "15" },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={Colors.warning}
                  />
                </View>
                <View>
                  <AppText style={styles.pickerLabel}>Time</AppText>
                  <AppText style={styles.pickerValue}>{formatTime(time)}</AppText>
                </View>
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Add technician remarks (optional)..."
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={2}
              containerStyle={styles.inputContainer}
            />
          </View>

          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                size="small"
                disabled={loading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Confirm"
                onPress={handleConfirm}
                variant="primary"
                size="small"
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === "ios");
            if (selectedDate) setDate(selectedDate);
          }}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedTime) => {
            setShowTimePicker(Platform.OS === "ios");
            if (selectedTime) setTime(selectedTime);
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 20,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: 14,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  pickerItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(30, 64, 175, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickerValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.xs,
  },
  inputContainer: {
    marginBottom: 0,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
