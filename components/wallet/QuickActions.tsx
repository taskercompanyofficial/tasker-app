import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/Button";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";

type Props = {
  onRecharge: () => void;
  onRefund: () => void;
};

export default function QuickActions({ onRecharge, onRefund }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Button
          title="Add via Card"
          onPress={onRecharge}
          size="small"
          fullWidth
          theme="customer"
          icon={<Ionicons name="card" size={16} color={Colors.neutral.white} />}
        />
      </View>
      <View style={styles.item}>
        <Button
          title="Refund"
          onPress={onRefund}
          size="small"
          fullWidth
          theme="customer"
          variant="outline"
          icon={<Ionicons name="wallet-outline" size={16} color={Colors.themes.customer.primary} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  item: {
    flex: 1,
  },
});
