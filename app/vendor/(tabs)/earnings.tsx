import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VendorEarnings() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>Track your payouts</Text>
        </View>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No earnings yet</Text>
        <Text style={styles.emptySubtitle}>
          Your completed jobs’ payouts will be shown here
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 6,
    textAlign: "center",
  },
});
