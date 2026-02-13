import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { router } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function VendorDashboard() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Provider Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Track jobs and earnings
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push("/vendor/(tabs)/settings")}
        >
          <Ionicons name="settings-outline" size={18} color={Colors.themes.provider.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: Colors.themes.provider.primary + "10" }]}>
          <Ionicons name="time-outline" size={18} color={Colors.themes.provider.primary} />
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardLabel}>Active Jobs</Text>
        </View>
        <View style={[styles.card, { backgroundColor: Colors.success + "10" }]}>
          <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardLabel}>Completed</Text>
        </View>
        <View style={[styles.card, { backgroundColor: Colors.warning + "12" }]}>
          <Ionicons name="wallet-outline" size={18} color={Colors.warning} />
          <Text style={styles.cardValue}>₨0</Text>
          <Text style={styles.cardLabel}>Earnings</Text>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.themes.provider.primary + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  cardsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  card: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
