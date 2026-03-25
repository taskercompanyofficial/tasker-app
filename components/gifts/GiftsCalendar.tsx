import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { DefaultRewardPolicy } from "@/constants/Rewards";

type Props = {
  streak: number;
};

export default function GiftsCalendar({ streak }: Props) {
  const days = Array.from({ length: DefaultRewardPolicy.cycleDays }, (_v, i) => {
    const day = i + 1;
    const percents = DefaultRewardPolicy.dailyDiscountPercents;
    const percent = percents[(day - 1) % percents.length];
    return { day, percent };
  });

  return (
    <View style={styles.grid}>
      {days.map(({ day, percent }) => {
        const achieved = day <= streak;
        return (
          <View key={day} style={[styles.cell, achieved && styles.cellAchieved]}>
            <Text style={[styles.day, achieved && styles.dayAchieved]}>Day {day}</Text>
            <Text style={[styles.reward, achieved && styles.rewardAchieved]}>{percent}% Off</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  cell: {
    width: "31%",
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.gray[200],
    backgroundColor: Colors.neutral.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cellAchieved: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: Colors.themes.customer.primary + "10",
  },
  day: {
    fontWeight: "700",
    color: Colors.text.primary,
  },
  dayAchieved: {
    color: Colors.themes.customer.primary,
  },
  reward: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  rewardAchieved: {
    color: Colors.themes.customer.primary,
  },
});
