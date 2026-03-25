import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";

type Props = {
  streak: number;
  max: number;
};

export default function DailyStreak({ streak, max }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Daily Streak</Text>
      <View style={styles.row}>
        {Array.from({ length: max }).map((_, i) => {
          const active = i < streak;
          return <View key={i} style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />;
        })}
      </View>
      <Text style={styles.meta}>{streak} / {max} days</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    borderColor: Colors.neutral.gray[200],
    borderWidth: 1,
    gap: Spacing.xs,
  },
  title: {
    fontWeight: "700",
    color: Colors.text.primary,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: Colors.themes.customer.primary,
  },
  dotInactive: {
    backgroundColor: Colors.neutral.gray[300],
  },
  meta: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
});
