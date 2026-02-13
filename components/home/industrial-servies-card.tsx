import ContactSupportModal from "@/components/orders/ContactSupportModal";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function IndustrialServicesCard() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.85)"]}
        style={styles.gradient}
        locations={[0, 0.4, 1]}
      >
        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Badge */}
            <View style={styles.badge}>
              <Ionicons
                name="business"
                size={12}
                color={Colors.neutral.white}
              />
              <Text style={styles.badgeText}>Commercial & Industrial</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              Need Services for{"\n"}Your Business?
            </Text>
            <Text style={styles.subtitle}>
              Get custom quotations for commercial units, factories, and
              industrial facilities
            </Text>
          </View>

          {/* Middle Section - Features */}
          <View style={styles.featuresSection}>
            <View style={styles.feature}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              </View>
              <Text style={styles.featureText}>Custom Solutions</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              </View>
              <Text style={styles.featureText}>Bulk Discounts</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              </View>
              <Text style={styles.featureText}>24/7 Support</Text>
            </View>
          </View>

          {/* Bottom Section - CTA Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/customer/commercial-quote")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="document-text"
                size={14}
                color={Colors.neutral.white}
              />
              <Text style={styles.primaryButtonText}>Request Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowContactModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubbles"
                size={14}
                color={Colors.themes.customer.primary}
              />
              <Text style={styles.secondaryButtonText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Contact Modal */}
      <ContactSupportModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
    height: 280,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    paddingBottom: Spacing.md,
  },
  topSection: {
    flex: 0,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.neutral.white,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.neutral.white,
    marginBottom: Spacing.xs,
    lineHeight: 18,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.neutral.white,
    lineHeight: 14,
    marginBottom: Spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresSection: {
    flex: 0,
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featureIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.neutral.white,
  },
  actionsSection: {
    flex: 0,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.neutral.white,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.neutral.white,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
    letterSpacing: 0.2,
  },
});
