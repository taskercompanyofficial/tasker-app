import CategoriesCards from "@/components/home/categories-cards";
import HomeHeader from "@/components/home/Header";
import IndustrialServicesCard from "@/components/home/industrial-servies-card";
import FreeInstallationCard from "@/components/home/free-installation-card";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingPage() {
  const [showPromo, setShowPromo] = useState(true);
  useEffect(() => {
    setShowPromo(true);
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HomeHeader />
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Tasker Company</Text>
          <Text style={styles.subtitle}>Choose a service to get started</Text>
        </View>
        <CategoriesCards />
        <FreeInstallationCard />
        <IndustrialServicesCard />
      </ScrollView>
      {showPromo && (
        <TouchableOpacity style={styles.promoOverlay} activeOpacity={1} onPress={() => setShowPromo(false)}>
          <View style={styles.promoContent}>
            <Image source={require("@/assets/images/banner-1.png")} style={styles.promoImage} resizeMode="contain" />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //    backgroundColor: "#ffffff",
    backgroundColor: Colors.background.tertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  content: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  promoContent: {
    width: "100%",
  },
  promoImage: {
    width: "100%",
    height: 240,
    borderRadius: 6,
  },
});
