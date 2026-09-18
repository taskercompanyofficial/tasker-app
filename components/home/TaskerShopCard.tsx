import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export default function TaskerShopCard() {
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shineAnim]);

  const translateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 400],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.themes.customer.primary, Colors.themes.customer.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardContent}
      >
        {/* Animated Shining Light Beam */}
        <Animated.View
          style={[
            styles.shineBeam,
            {
              transform: [{ translateX }, { rotate: "22deg" }],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0)",
              "rgba(255, 255, 255, 0.35)",
              "rgba(255, 255, 255, 0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Left Section: 3D Electronics Banner */}
        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/tasker_estore_banner.jpg")}
            style={styles.shopImage}
            resizeMode="cover"
          />
        </View>

        {/* Content Section */}
        <View style={styles.bodySection}>
          <View style={styles.header}>
            <Text style={styles.title}>Tasker E-Store</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            Buy original home appliances, electronic spare parts & tools.
          </Text>
        </View>

        {/* Lock Badge */}
        <View style={styles.rightSection}>
          <View style={styles.lockCircle}>
            <Ionicons
              name="lock-closed"
              size={16}
              color={Colors.themes.customer.primary}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  shineBeam: {
    position: "absolute",
    top: -50,
    bottom: -50,
    width: 70,
    zIndex: 2,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: Spacing.md,
  },
  shopImage: {
    width: "100%",
    height: "100%",
  },
  bodySection: {
    flex: 1,
    paddingRight: Spacing.xs,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
  },
  comingSoonBadge: {
    backgroundColor: Colors.themes.customer.accent,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.themes.customer.primaryDark,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },
  rightSection: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    zIndex: 1,
  },
  lockCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.themes.customer.accent,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
});
