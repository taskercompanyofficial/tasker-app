import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { Ionicons, MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  useColorScheme,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VendorSupportChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleCall = () => {
    Linking.openURL("tel:03041112717").catch(() => {});
  };

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/923041112717").catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={
          isDark ? "rgba(0, 0, 0, 0.40)" : "rgba(255, 255, 255, 0.40)"
        }
        translucent
      />
      {/* App Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Profile Info */}
        <View style={styles.headerProfileContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require("@/assets/images/tasker-ai-avatar.jpg")}
              style={styles.avatarImg}
            />
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.headerTextContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Vendor Partner Helpdesk
              </Text>
              <MaterialCommunityIcons
                name="check-decagram"
                size={14}
                color={Colors.themes.provider.primary}
              />
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                ⚡ 24/7 AI Operations Assistant • Online
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={15} color={Colors.themes.provider.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.whatsappBtn]}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <FontAwesome name="whatsapp" size={16} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Real-time Chat Room */}
      <View style={{ flex: 1 }}>
        <ChatRoom hideHeader={true} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerProfileContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 10,
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#22C55E",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  callBtn: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  whatsappBtn: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
});
