import Colors from "@/constants/Colors";
import { StyleSheet } from "react-native";

// Shared section styles used across work order detail components
export const sectionStyles = StyleSheet.create({
  section: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.neutral.white,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  sectionContent: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
});

// Shared field styles for displaying label-value pairs
export const fieldStyles = StyleSheet.create({
  fieldGroup: {
    gap: 2,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  fieldValue: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
});

// Shared modal styles
export const modalStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  buttonContainer: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: "#111827",
    textAlignVertical: "top",
    marginTop: 12,
    minHeight: 80,
  },
});

// Priority color configs
export const PRIORITY_COLORS = {
  urgent: { bg: "#FEE2E2", text: "#DC2626" },
  high: { bg: "#FEF3C7", text: "#D97706" },
  medium: { bg: "#DBEAFE", text: "#2563EB" },
  low: { bg: "#D1FAE5", text: "#059669" },
  default: { bg: "#F3F4F6", text: "#6B7280" },
} as const;

export const getPriorityColor = (priority?: string) => {
  const key = priority?.toLowerCase() as keyof typeof PRIORITY_COLORS;
  return PRIORITY_COLORS[key] || PRIORITY_COLORS.default;
};

// Status color configs
export const STATUS_COLORS = {
  active: { bg: "#D1FAE5", text: "#059669" },
  inactive: { bg: "#FEE2E2", text: "#DC2626" },
  pending: { bg: "#FEF3C7", text: "#D97706" },
  default: { bg: "#F3F4F6", text: "#6B7280" },
} as const;

export const getStatusColor = (status?: string) => {
  const key = status?.toLowerCase() as keyof typeof STATUS_COLORS;
  return STATUS_COLORS[key] || STATUS_COLORS.default;
};
