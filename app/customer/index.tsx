import CategoriesCards from "@/components/home/categories-cards";
import FreeInstallationCard from "@/components/home/free-installation-card";
import HomeHeader from "@/components/home/Header";
import IndustrialServicesCard from "@/components/home/industrial-servies-card";
import TaskerShopCard from "@/components/home/TaskerShopCard";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingPage() {
  const { session } = useSession();
  const router = useRouter();
  const [showPromo, setShowPromo] = useState(true);

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    // backgroundColor: Colors.background.white,
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
