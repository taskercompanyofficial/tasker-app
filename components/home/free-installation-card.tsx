import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function FreeInstallationCard() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/customer/free-installation")}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[Colors.success, Colors.themes.customer.primary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="gift" size={20} color={Colors.neutral.white} />
            </View>
          </View>

          {/* Middle Section */}
          <View style={styles.middleSection}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>FREE SERVICE</Text>
            </View>
            <Text style={styles.title}>Free Installation</Text>
            <Text style={styles.subtitle}>AC & Washing Machine</Text>
            <View style={styles.citiesRow}>
              <Ionicons
                name="location"
                size={12}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.citiesText}>4 Major Cities</Text>
            </View>
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            <View style={styles.arrowButton}>
              <Ionicons name="arrow-forward" size={16} color={Colors.success} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  gradient: {
    padding: Spacing.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  leftSection: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  middleSection: {
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: Colors.neutral.white,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.neutral.white,
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 2,
  },
  citiesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  citiesText: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
  rightSection: {
    justifyContent: "center",
    alignItems: "center",
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
