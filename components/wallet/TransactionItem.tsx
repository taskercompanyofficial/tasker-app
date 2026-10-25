import AppText from "@/components/common/AppText";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { WalletTransaction } from "@/lib/wallet";

type Props = {
  txn: WalletTransaction;
};

export default function TransactionItem({ txn }: Props) {
  return (
    <View style={styles.item}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, getIconStyle(txn)]}>
          <Ionicons name={getIcon(txn)} size={14} color={getIconColor(txn)} />
        </View>
        <View style={styles.textWrap}>
          <AppText style={styles.title}>{txn.title}</AppText>
          <AppText style={styles.meta}>{txn.date}</AppText>
        </View>
      </View>
      <View style={styles.right}>
        <AppText style={[styles.amount, txn.amount < 0 ? styles.neg : styles.pos]}>
          {txn.amount < 0 ? "-" : "+"} PKR {Math.abs(txn.amount).toFixed(0)}
        </AppText>
        <AppText style={[styles.status, getStatusStyle(txn.status)]}>{formatStatus(txn.status)}</AppText>
      </View>
    </View>
  );
}

function getIcon(t: WalletTransaction) {
  if (t.type === "recharge") return "add-circle";
  if (t.type === "refund") return "refresh";
  if (t.type === "gift") return "gift";
  return "arrow-down-circle";
}

function getIconColor(t: WalletTransaction) {
  if (t.type === "recharge") return Colors.success;
  if (t.type === "refund") return Colors.warning;
  if (t.type === "gift") return Colors.success;
  return Colors.error;
}

function getIconStyle(t: WalletTransaction) {
  if (t.type === "recharge") return { backgroundColor: Colors.success + "15" };
  if (t.type === "refund") return { backgroundColor: Colors.warning + "15" };
  if (t.type === "gift") return { backgroundColor: Colors.success + "15" };
  return { backgroundColor: Colors.error + "15" };
}

function getStatusStyle(status: WalletTransaction["status"]) {
  if (status === "success") return { color: Colors.success };
  if (status === "pending") return { color: Colors.warning };
  return { color: Colors.error };
}

function formatStatus(status: WalletTransaction["status"]) {
  if (status === "success") return "Success";
  if (status === "pending") return "Pending";
  return "Failed";
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray[100],
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  meta: {
    fontSize: 10,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  amount: {
    fontSize: 13,
    fontWeight: "700",
  },
  pos: {
    color: Colors.success,
  },
  neg: {
    color: Colors.error,
  },
  status: {
    fontSize: 10,
  },
});
