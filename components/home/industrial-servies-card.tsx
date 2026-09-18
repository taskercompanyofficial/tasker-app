import ContactSupportModal from "@/components/orders/ContactSupportModal";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Mask,
  Pattern,
  Rect,
  Stop,
} from "react-native-svg";

export default function IndustrialServicesCard() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardContent}
      >
        {/* Background Dotted Pattern with Top-Left to Bottom-Right Fading Opacity */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <SvgGradient id="dotFade" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#FFF" stopOpacity="0.55" />
                <Stop offset="45%" stopColor="#FFF" stopOpacity="0.25" />
                <Stop offset="85%" stopColor="#FFF" stopOpacity="0.05" />
                <Stop offset="100%" stopColor="#FFF" stopOpacity="0.0" />
              </SvgGradient>

              <Mask id="dottedMask">
                <Rect width="100%" height="100%" fill="url(#dotFade)" />
              </Mask>

              <Pattern
                id="dotPattern"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                <Circle cx="3" cy="3" r="1.4" fill="#38BDF8" />
              </Pattern>
            </Defs>

            <Rect
              width="100%"
              height="100%"
              fill="url(#dotPattern)"
              mask="url(#dottedMask)"
            />
          </Svg>
        </View>

        {/* Top Header Row with Badge & 3D Thumbnail */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <View style={styles.badge}>
              <Ionicons name="business" size={11} color="#38BDF8" />
              <Text style={styles.badgeText}>COMMERCIAL & INDUSTRIAL</Text>
            </View>

            <Text style={styles.title}>Services for Your Business</Text>
            <Text style={styles.subtitle}>
              HVAC, Heavy Electrical & Facility Maintenance with Custom B2B Rates.
            </Text>
          </View>

          {/* 3D Commercial HVAC Thumbnail */}
          <View style={styles.imageWrapper}>
            <Image
              source={require("@/assets/images/industrial_commercial_hvac.jpg")}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Features Row */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.featureText}>Custom Quotes</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.featureText}>Bulk Discounts</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.featureText}>24/7 SLA Support</Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/customer/commercial-quote")}
            activeOpacity={0.85}
          >
            <Ionicons name="document-text" size={15} color={Colors.neutral.white} />
            <Text style={styles.primaryButtonText}>Request Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowContactModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons
              name="chatbubbles"
              size={15}
              color={Colors.themes.customer.primary}
            />
            <Text style={styles.secondaryButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Contact Support Modal */}
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
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
    elevation: 5,
  },
  cardContent: {
    padding: Spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
    zIndex: 3,
  },
  headerTextCol: {
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    marginBottom: Spacing.xs + 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: Typography.sizes.base + 1,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Shadows.sm,
    zIndex: 2,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  featuresRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 3,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featureText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    zIndex: 3,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.neutral.white,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
});
