import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import React from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VendorJobs() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <Text style={styles.headerSubtitle}>View and manage assigned jobs</Text>
        </View>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No jobs yet</Text>
        <Text style={styles.emptySubtitle}>
          Jobs assigned to you will appear here
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
