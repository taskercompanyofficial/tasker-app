import { localizedToast } from "@/lib/i18n/localized-toast";
import { localizedAlert } from "@/lib/i18n/localized-alert";
import AppTextInput from "@/components/common/AppTextInput";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { WORK_ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  orderNumber: string;
  currentDate?: string;
  currentTime?: string;
  currentReminder?: string;
  onSuccess: () => void;
}

const WORKING_HOURS_START = 9;
const WORKING_HOURS_END = 18;

export default function RescheduleModal({
  visible,
  onClose,
  orderNumber,
  currentDate,
  currentTime,
  currentReminder,
  onSuccess,
}: RescheduleModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = width < 360;
  const modalMaxWidth = Math.min(width - 32, 420);
  const maxModalHeight = height - (insets.top + insets.bottom + 40);

  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState<Date>(() => {
    const d = new Date();
    const h = d.getHours();
    if (h < WORKING_HOURS_START || h >= WORKING_HOURS_END) {
      d.setHours(10, 0, 0, 0);
    }
    return d;
  });
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminder, setReminder] = useState("1h");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (currentDate) {
        const parsed = new Date(currentDate);
        if (!isNaN(parsed.getTime())) {
          setScheduledDate(parsed);
          setTempDate(parsed);
        }
      }
      if (currentReminder) {
        setReminder(currentReminder);
      }
    }
  }, [visible, currentDate, currentReminder]);

  const reminderOptions = [
    { id: "30m", label: "30 mins before" },
    { id: "1h", label: "1 hr before" },
    { id: "2h", label: "2 hrs before" },
    { id: "1d", label: "1 day before" },
    { id: "off", label: "Off" },
  ];

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setScheduledDate(date);
    setTempDate(date);
  };

  const validateTime = (time: Date): Date => {
    const hour = time.getHours();
    const validatedTime = new Date(time);
    if (hour < WORKING_HOURS_START) {
      validatedTime.setHours(WORKING_HOURS_START, 0, 0, 0);
    } else if (hour >= WORKING_HOURS_END) {
      validatedTime.setHours(WORKING_HOURS_END - 1, 0, 0, 0);
    }
    return validatedTime;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDateForApi = (date: Date) => {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return `${y}-${m}-${d}`;
  };
  const formatTimeForApi = (date: Date) => {
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    return `${h}:${m}:${s}`;
  };

  const handleRescheduleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        scheduled_date: formatDateForApi(scheduledDate),
        scheduled_time: formatTimeForApi(scheduledTime),
        reminder_option: reminder,
        notes: rescheduleNotes.trim() || undefined,
      };

      const res = await myAxios.post(
        `${WORK_ORDER_URL}/${orderNumber}/reschedule`,
        payload
      );

      if (res.data.status === "success" || res.status === 200) {
        localizedToast({
          type: "success",
          text1: "Schedule Updated",
          text2: `Rescheduled to ${formatDate(scheduledDate)} at ${formatTime(scheduledTime)}`,
        });
        onSuccess();
        onClose();
      } else {
        localizedAlert("Error", res.data?.message || "Failed to update schedule.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update schedule. Please try again.";
      localizedAlert("Reschedule Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="calendar" size={18} color={Colors.themes.customer.primary} />
                </View>
                <View>
                  <AppText style={[styles.title, isSmallScreen && { fontSize: 16 }]}>Reschedule Order</AppText>
                  <AppText style={styles.subtitle}>Order #{orderNumber}</AppText>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Date Shortcuts */}
            <AppText style={styles.sectionLabel}>QUICK DATE SELECTION</AppText>
            <View style={styles.quickDateRow}>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => setQuickDate(0)} activeOpacity={0.7}>
                <AppText style={styles.quickDateText}>Today</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => setQuickDate(1)} activeOpacity={0.7}>
                <AppText style={styles.quickDateText}>Tomorrow</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => setQuickDate(2)} activeOpacity={0.7}>
                <AppText style={styles.quickDateText}>In 2 Days</AppText>
              </TouchableOpacity>
            </View>

            {/* Date & Time Selectors */}
            <AppText style={styles.sectionLabel}>APPOINTMENT TIMING</AppText>
            <View style={styles.scheduleRow}>
              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={() => {
                  setTempDate(scheduledDate);
                  setShowDatePicker(true);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.pickerIconWrap}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.themes.customer.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.btnLabel}>DATE</AppText>
                  <AppText style={styles.btnValue} numberOfLines={1}>{formatDate(scheduledDate)}</AppText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={() => {
                  setTempTime(scheduledTime);
                  setShowTimePicker(true);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.pickerIconWrap}>
                  <Ionicons name="time-outline" size={18} color={Colors.themes.customer.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.btnLabel}>TIME</AppText>
                  <AppText style={styles.btnValue} numberOfLines={1}>{formatTime(scheduledTime)}</AppText>
                </View>
              </TouchableOpacity>
            </View>

            {/* Reminder Options */}
            <View style={styles.reminderSection}>
              <AppText style={styles.sectionLabel}>SERVICE REMINDER</AppText>
              <AppText style={styles.reminderSubtitle}>Notify me before technician arrival</AppText>
              <View style={styles.reminderChips}>
                {reminderOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.reminderChip,
                      reminder === opt.id && styles.reminderChipSelected,
                    ]}
                    onPress={() => setReminder(opt.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={reminder === opt.id ? "notifications" : "notifications-outline"}
                      size={12}
                      color={reminder === opt.id ? Colors.themes.customer.primary : Colors.text.tertiary}
                    />
                    <AppText
                      style={[
                        styles.reminderChipText,
                        reminder === opt.id && styles.reminderChipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reschedule Note */}
            <View style={styles.notesSection}>
              <AppText style={styles.sectionLabel}>OPTIONAL NOTE FOR TECHNICIAN</AppText>
              <AppTextInput
                style={styles.notesInput}
                placeholder="Reason or time preferences (e.g., Please come after 3 PM)..."
                placeholderTextColor={Colors.text.tertiary}
                value={rescheduleNotes}
                onChangeText={setRescheduleNotes}
                multiline
                numberOfLines={2}
                maxLength={300}
              />
            </View>

            {/* Submit Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <AppText style={styles.cancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleRescheduleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.neutral.white} size="small" />
                ) : (
                  <>
                    <AppText style={styles.submitText}>Save Changes</AppText>
                    <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* iOS Date Picker Modal */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal transparent animationType="fade" visible={showDatePicker}>
          <View style={styles.iosPickerOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <AppText style={styles.iosCancelText}>Cancel</AppText>
                </TouchableOpacity>
                <AppText style={styles.iosPickerTitle}>Select Date</AppText>
                <TouchableOpacity
                  onPress={() => {
                    setScheduledDate(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <AppText style={styles.iosDoneText}>Done</AppText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  if (date) setTempDate(date);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === "ios" && showTimePicker && (
        <Modal transparent animationType="fade" visible={showTimePicker}>
          <View style={styles.iosPickerOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <AppText style={styles.iosCancelText}>Cancel</AppText>
                </TouchableOpacity>
                <AppText style={styles.iosPickerTitle}>Select Time</AppText>
                <TouchableOpacity
                  onPress={() => {
                    setScheduledTime(validateTime(tempTime));
                    setShowTimePicker(false);
                  }}
                >
                  <AppText style={styles.iosDoneText}>Done</AppText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={(_, time) => {
                  if (time) setTempTime(time);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Native Date & Time Pickers */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setScheduledDate(date);
          }}
        />
      )}

      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={scheduledTime}
          mode="time"
          display="default"
          onChange={(_, time) => {
            setShowTimePicker(false);
            if (time) setScheduledTime(validateTime(time));
          }}
        />
      )}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 6,
  },
  quickDateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
  },
  quickDateChip: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  scheduleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: Spacing.md,
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pickerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.themes.customer.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  btnLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  btnValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 1,
  },
  reminderSection: {
    marginBottom: Spacing.md,
  },
  reminderSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 8,
  },
  reminderChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  reminderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reminderChipSelected: {
    backgroundColor: Colors.themes.customer.primary + "15",
    borderColor: Colors.themes.customer.primary,
  },
  reminderChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  reminderChipTextSelected: {
    color: Colors.themes.customer.primary,
    fontWeight: "700",
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  notesInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 56,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  submitBtn: {
    flex: 1.6,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.themes.customer.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.neutral.white,
  },
  iosPickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  iosPickerContainer: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  iosCancelText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  iosDoneText: {
    color: Colors.themes.customer.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
