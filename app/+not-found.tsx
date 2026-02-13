import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View, Image } from "react-native";
import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography, Shadows } from "@/constants/Styles";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops! Page Not Found" }} />
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/not-found.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </Text>

        <Link href="/customer" style={styles.link}>
          <Text style={styles.linkText}>Go to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    backgroundColor: Colors.neutral.gray[50],
  },
  image: {
    width: 280,
    height: 200,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.extrabold,
    marginBottom: Spacing.xs,
    color: Colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
    maxWidth: 300,
  },
  link: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  linkText: {
    fontSize: Typography.sizes.base,
    color: Colors.neutral.white,
    fontWeight: Typography.weights.bold,
  },
});
