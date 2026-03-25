import Button from "@/components/Button";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ActionButtonsProps {
  workOrderId: number;
  isPendingAcceptance: boolean;
  isAccepted: boolean;
  currentStatusSlug?: string;
  currentSubStatusSlug?: string;
  accepting: boolean;
  rejecting: boolean;
  updatingStatus: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onSchedule: () => void;
  onStatusUpdate: (
    statusSlug: string,
    subStatusSlug: string,
    statusName: string,
  ) => void;
}

export default function ActionButtons({
  workOrderId,
  isPendingAcceptance,
  isAccepted,
  currentStatusSlug,
  currentSubStatusSlug,
  accepting,
  rejecting,
  updatingStatus,
  onAccept,
  onReject,
  onCancel,
  onSchedule,
  onStatusUpdate,
}: ActionButtonsProps) {
  // 1. Pending Acceptance - Show Accept/Reject
  if (isPendingAcceptance) {
    return (
      <View style={styles.actionsCard}>
        <View style={styles.buttonContainer}>
          <Button
            title="Reject"
            onPress={onReject}
            variant="outline"
            size="medium"
            fullWidth
            disabled={accepting || rejecting}
            loading={rejecting}
            theme="vendor"
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Accept"
            onPress={onAccept}
            variant="primary"
            size="medium"
            fullWidth
            disabled={accepting || rejecting}
            loading={accepting}
            theme="vendor"
          />
        </View>
      </View>
    );
  }

  // 2. Active States (Accepted or In Progress)
  if (
    isAccepted ||
    currentStatusSlug === "in-progress" ||
    currentStatusSlug === "scheduled"
  ) {
    return (
      <View style={styles.columnContainer}>
        {/* Primary Action: Status Transition */}
        <View style={{ marginBottom: Spacing.sm }}>
          {currentStatusSlug === "accepted" ||
          currentStatusSlug === "scheduled" ? (
            <Button
              title="Start Service"
              onPress={() => onStatusUpdate("in-progress", "", "In Progress")}
              variant="primary"
              size="medium"
              fullWidth
              loading={updatingStatus}
              theme="vendor"
            />
          ) : currentStatusSlug === "in-progress" ? (
            <Button
              title="Reach Completion"
              onPress={() => onStatusUpdate("completed", "", "Completed")}
              variant="success"
              size="medium"
              fullWidth
              loading={updatingStatus}
              theme="vendor"
            />
          ) : null}
        </View>

        {/* Secondary Actions: Edit Details */}
        <View style={{ marginBottom: Spacing.sm }}>
          <Button
            title="Update Product/Warranty Details"
            onPress={() =>
              router.push({
                pathname: "/vendor/work-order-edit/[id]",
                params: { id: workOrderId.toString() },
              } as any)
            }
            variant="outline"
            size="medium"
            fullWidth
            theme="vendor"
          />
        </View>

        {/* tertiary Actions: Schedule / Cancel */}
        <View style={styles.actionsCard}>
          <View style={styles.buttonContainer}>
            <Button
              title="Reschedule"
              onPress={onSchedule}
              variant="outline"
              size="small"
              fullWidth
              disabled={updatingStatus}
              theme="vendor"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel Job"
              onPress={onCancel}
              variant="danger"
              size="small"
              fullWidth
              disabled={rejecting}
              theme="vendor"
            />
          </View>
        </View>
      </View>
    );
  }

  // 3. Terminal States (Completed, Cancelled, Rejected)
  if (
    currentStatusSlug === "completed" ||
    currentStatusSlug === "cancelled" ||
    currentStatusSlug === "rejected"
  ) {
    return (
      <View style={styles.terminalState}>
        <Text style={styles.terminalText}>
          This job is {currentStatusSlug}. No further actions required.
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  columnContainer: {
    width: "100%",
  },
  actionsCard: {
    borderRadius: 12,
    flexDirection: "row",
    gap: Spacing.md,
  },
  buttonContainer: {
    flex: 1,
  },
  terminalState: {
    padding: Spacing.md,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  terminalText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
});
