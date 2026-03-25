import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";

type Props = {
  balance: number;
};

export default function BalanceCard({ balance }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.label}>Wallet Balance</Text>
        <Text style={styles.value}>PKR {balance.toFixed(2)}</Text>
        <Text style={styles.meta}>Updated just now • Wallet ID: **** 4821</Text>
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.neutral.white} />
            <Text style={styles.badgeText}>Secure</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="card" size={12} color={Colors.neutral.white} />
            <Text style={styles.badgeText}>Default: Card</Text>
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.iconCircle}>
          <Ionicons name="wallet-outline" size={24} color={Colors.neutral.white} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  right: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Colors.neutral.white,
    fontSize: 11,
    opacity: 0.9,
  },
  value: {
    color: Colors.neutral.white,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  meta: {
    color: Colors.neutral.white,
    opacity: 0.85,
    fontSize: 10,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.neutral.white + "40",
    backgroundColor: Colors.neutral.white + "10",
  },
  badgeText: {
    color: Colors.neutral.white,
    fontSize: 11,
    fontWeight: "600",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral.white + "10",
    borderWidth: 1,
    borderColor: Colors.neutral.white + "30",
  },
});
