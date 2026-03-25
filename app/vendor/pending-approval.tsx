import Button from "@/components/Button";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PendingApproval() {
  const router = useRouter();
  const { signOut, refetchUser } = useSession();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="time-outline" size={60} color={Colors.warning} />
        </View>

        <Text style={styles.title}>Approval Pending</Text>
        <Text style={styles.description}>
          Your account details have been submitted and are currently under review by our team. 
          We will notify you once your account has been approved.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            This process usually takes 24-48 hours. Thank you for your patience.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Check Status"
            onPress={() => refetchUser("vendor")}
            fullWidth
            theme="vendor"
          />
          <Button
            title="Sign Out"
            onPress={() => signOut()}
            variant="outline"
            fullWidth
            theme="vendor"
          />
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.warning + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.info + "10",
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl * 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: Spacing.md,
  },
});
