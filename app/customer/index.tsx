import AppText from "@/components/common/AppText";
import CategoriesCards from "@/components/home/categories-cards";
import FreeInstallationCard from "@/components/home/free-installation-card";
import HomeHeader from "@/components/home/Header";
import IndustrialServicesCard from "@/components/home/industrial-servies-card";
import TaskerShopCard from "@/components/home/TaskerShopCard";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingPage() {
  const { session } = useSession();
  const router = useRouter();
  const [showPromo, setShowPromo] = useState(true);

  // Guarantee dark status bar items and matching header background whenever focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("dark-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor(Colors.background.tertiary);
      }
    }, [])
  );

  useEffect(() => {
    const user = session.customerUser || session.user;
    if (user) {
      const name = (user.name || "").trim();
      const isPlaceholder =
        !name ||
        /^cus[A-Z0-9]{4,20}$/i.test(name) ||
        name === "Customer" ||
        name === "User";
      if (isPlaceholder) {
        router.replace("/customer/complete-profile");
      }
    }
  }, [session.customerUser, session.user]);

  useEffect(() => {
    setShowPromo(true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background.tertiary}
        translucent={false}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <HomeHeader />
          <View style={styles.content}>
            <AppText style={styles.title}>Welcome to Tasker Company</AppText>
            <AppText style={styles.subtitle}>Choose a service to get started</AppText>
          </View>
          <CategoriesCards />
          <FreeInstallationCard />
          <TaskerShopCard />
          <IndustrialServicesCard />
        </ScrollView>
        {showPromo && (
          <TouchableOpacity
            style={styles.promoOverlay}
            activeOpacity={1}
            onPress={() => setShowPromo(false)}
          >
            <View style={styles.promoContent}>
              <Image
                source={require("@/assets/images/banner-1.png")}
                style={styles.promoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.tertiary, // Seamless color match with HomeHeader
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
