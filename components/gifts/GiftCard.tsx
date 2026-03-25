import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import Button from "@/components/Button";
import { Gift } from "@/lib/gifts";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  gift: Gift;
  onClaim: (id: string) => void;
};

export default function GiftCard({ gift, onClaim }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.icon}>
          <Ionicons name="gift" size={18} color={Colors.themes.customer.primary} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>
            {gift.discountPercent
              ? `${gift.discountPercent}% Off Voucher`
              : gift.title}
          </Text>
          <Text style={styles.meta}>Added {new Date(gift.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={styles.right}>
        {gift.discountPercent ? (
          <Text style={styles.amount}>One-time Use</Text>
        ) : (
          <Text style={styles.amount}>+ PKR {gift.amount}</Text>
        )}
        <Button title="Claim" size="small" onPress={() => onClaim(gift.id)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary + "15",
  },
  texts: { flex: 1 },
  title: { fontWeight: "700", color: Colors.text.primary },
  meta: { color: Colors.text.secondary, fontSize: 12, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 6 },
  amount: { color: Colors.success, fontWeight: "700" },
});
