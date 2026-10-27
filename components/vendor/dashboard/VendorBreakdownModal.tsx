import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/common/AppText";

interface VendorBreakdownModalProps {
  visible: boolean;
  mode: "daily" | "monthly";
  onClose: () => void;
  todayEarnings: number;
  dailyCashCollected?: number;
  companyShare: number;
  dueTodayPayable: number;
  dailyAmount: string;
  monthlyAccrued: number;
  monthlyAmount: string;
}

export default function VendorBreakdownModal({
  visible,
  mode,
  onClose,
  todayEarnings,
  dailyCashCollected = 0,
  companyShare,
  dueTodayPayable,
  dailyAmount,
  monthlyAccrued,
  monthlyAmount,
}: VendorBreakdownModalProps) {
  const isDaily = mode === "daily";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sheetBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <AppText style={styles.sheetTitle}>
                {isDaily ? "Daily Share Breakdown" : "Monthly Claims Breakdown"}
              </AppText>
              <AppText style={styles.sheetSubtitle}>
                {isDaily
                  ? "35% company cut from extra on-site collections"
                  : "100% full reimbursement for warranty & installation claims"}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Breakdown Body */}
          <View style={styles.sheetBody}>
            {isDaily ? (
              <>
                <View style={styles.sheetRow}>
                  <AppText style={styles.sheetRowLabel}>Customer Cash Collected On-Site</AppText>
                  <AppText style={styles.sheetRowValue}>
                    PKR {(dailyCashCollected > 0 ? dailyCashCollected : (todayEarnings + companyShare)).toLocaleString()}
                  </AppText>
                </View>
                <View style={styles.sheetRow}>
                  <AppText style={styles.sheetRowLabel}>Company Commission (35%)</AppText>
                  <AppText style={[styles.sheetRowValue, { color: "#DC2626" }]}>
                    - PKR {companyShare.toLocaleString()}
                  </AppText>
                </View>
                <View style={styles.sheetRow}>
                  <AppText style={styles.sheetRowLabel}>Daily Payables Settled</AppText>
                  <AppText
                    style={[
                      styles.sheetRowValue,
                      { color: dueTodayPayable === 0 ? "#16A34A" : "#D97706" },
                    ]}
                  >
                    {dueTodayPayable === 0
                      ? "Settled (PKR 0 Due)"
                      : `PKR ${dueTodayPayable.toLocaleString()} Due`}
                  </AppText>
                </View>
                <View style={[styles.sheetRow, styles.sheetTotalRow]}>
                  <AppText style={styles.sheetTotalLabel}>Net Partner Cash Kept</AppText>
                  <AppText style={styles.sheetTotalValue}>PKR {dailyAmount}</AppText>
                </View>
              </>
            ) : (
              <>
                <View style={styles.sheetRow}>
                  <AppText style={styles.sheetRowLabel}>Total Accrued Balance</AppText>
                  <AppText style={styles.sheetRowValue}>
                    PKR {monthlyAmount}
                  </AppText>
                </View>
                <View style={styles.sheetRow}>
                  <AppText style={styles.sheetRowLabel}>Free Installation & Warranty Claims</AppText>
                  <AppText style={styles.sheetRowValue}>
                    PKR {Number(monthlyAccrued).toLocaleString()}
                  </AppText>
                </View>
                <View style={styles.sheetRow}>
                  <AppText style={styles.sheetRowLabel}>Company Deduction Fee</AppText>
                  <AppText style={[styles.sheetRowValue, { color: "#16A34A" }]}>
                    0% (Waived)
                  </AppText>
                </View>
                <View style={styles.sheetRow}>
                  <AppText style={styles.sheetRowLabel}>Monthly Payout Window</AppText>
                  <AppText style={[styles.sheetRowValue, { color: "#2563EB" }]}>
                    1st – 5th of Next Month
                  </AppText>
                </View>
                <View style={[styles.sheetRow, styles.sheetTotalRow]}>
                  <AppText style={styles.sheetTotalLabel}>Total Disbursable Balance</AppText>
                  <AppText style={styles.sheetTotalValue}>PKR {monthlyAmount}</AppText>
                </View>
              </>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.sheetActionBtn}
            activeOpacity={0.88}
            onPress={onClose}
          >
            <AppText style={styles.sheetActionBtnText}>Close Breakdown</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sheetSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: {
    paddingVertical: 16,
    gap: 12,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetRowLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  sheetRowValue: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  sheetTotalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 4,
  },
  sheetTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  sheetTotalValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  sheetActionBtn: {
    marginTop: 8,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
