import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import ContactSupportModal from "@/components/orders/ContactSupportModal";
import { useLanguage } from "@/context/language-context";
import { translateStaticCopy } from "@/lib/i18n/static-copy";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactUsPage() {
  const { language } = useLanguage();
  const [showContactModal, setShowContactModal] = useState(false);

  const contactMethods = [
    {
      icon: "call",
      title: "Phone",
      subtitle: "03041112717",
      color: Colors.themes.customer.primary,
      onPress: () => Linking.openURL("tel:03041112717"),
    },
    {
      icon: "logo-whatsapp",
      title: "WhatsApp",
      subtitle: "Chat with us",
      color: Colors.social.whatsapp,
      onPress: () => {
        const phoneNumber = "923041112717";
        const message = translateStaticCopy("Hello, I need help with...", language);
        Linking.openURL(
          `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`,
        ).catch(() => {
          Linking.openURL(
            `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
          );
        });
      },
    },
    {
      icon: "mail",
      title: "Email",
      subtitle: "info@taskercompany.com",
      color: Colors.themes.provider.primaryLight,
      onPress: () => Linking.openURL("mailto:info@taskercompany.com"),
    },
    {
      icon: "location",
      title: "Address",
      subtitle:
        "E150/2, st #9, Opposite Adil Hopital, DHA Phase 1, Lahore, Pakistan",
      color: Colors.error,
      onPress: () => {},
    },
  ];

  const socialMedia = [
    {
      icon: "logo-facebook",
      name: "Facebook",
      color: Colors.social.facebook,
      url: "https://facebook.com",
    },
    {
      icon: "logo-instagram",
      name: "Instagram",
      color: Colors.social.instagram,
      url: "https://instagram.com",
    },
    {
      icon: "logo-twitter",
      name: "Twitter",
      color: Colors.social.twitter,
      url: "https://twitter.com",
    },
    {
      icon: "logo-linkedin",
      name: "LinkedIn",
      color: Colors.social.linkedin,
      url: "https://linkedin.com",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <DirectionalIcon name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Contact Us</AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="chatbubbles"
              size={48}
              color={Colors.themes.customer.primary}
            />
          </View>
          <AppText style={styles.heroTitle}>We&apos;re Here to Help</AppText>
          <AppText style={styles.heroSubtitle}>
            Get in touch with us through any of the following methods
          </AppText>
        </View>

        {/* Contact Methods */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Contact Methods</AppText>
          {contactMethods.map((method, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={method.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.contactIcon,
                  { backgroundColor: method.color + "15" },
                ]}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={method.color}
                />
              </View>
              <View style={styles.contactInfo}>
                <AppText style={styles.contactTitle}>{method.title}</AppText>
                <AppText style={styles.contactSubtitle}>{method.subtitle}</AppText>
              </View>
              <DirectionalIcon
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Contact Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.quickContactButton}
            onPress={() => setShowContactModal(true)}
          >
            <Ionicons name="call" size={20} color={Colors.neutral.white} />
            <AppText style={styles.quickContactText}>Quick Contact</AppText>
          </TouchableOpacity>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Follow Us</AppText>
          <View style={styles.socialContainer}>
            {socialMedia.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.socialButton,
                  { backgroundColor: social.color + "15" },
                ]}
                onPress={() => Linking.openURL(social.url)}
              >
                <Ionicons
                  name={social.icon as any}
                  size={28}
                  color={social.color}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Business Hours */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Business Hours</AppText>
          <View style={styles.hoursCard}>
            <View style={styles.hourRow}>
              <AppText style={styles.dayText}>Monday - Friday</AppText>
              <AppText style={styles.timeText}>9:00 AM - 6:00 PM</AppText>
            </View>
            <View style={styles.hourRow}>
              <AppText style={styles.dayText}>Saturday</AppText>
              <AppText style={styles.timeText}>10:00 AM - 4:00 PM</AppText>
            </View>
            <View style={styles.hourRow}>
              <AppText style={styles.dayText}>Sunday</AppText>
              <AppText style={styles.timeText}>Closed</AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Contact Support Modal */}
      <ContactSupportModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  quickContactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.themes.customer.primary,
    marginHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickContactText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: "700",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  hoursCard: {
    backgroundColor: Colors.neutral.white,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  timeText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
