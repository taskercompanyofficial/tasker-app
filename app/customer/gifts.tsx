import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import DailyStreak from "@/components/gifts/DailyStreak";
import GiftsCalendar from "@/components/gifts/GiftsCalendar";
import GiftCard from "@/components/gifts/GiftCard";
import { DefaultRewardPolicy } from "@/constants/Rewards";
import { ensureTodayDailyGift, getStreak, getUnclaimed, claimGift, Gift } from "@/lib/gifts";
import Toast from "react-native-toast-message";

export default function Gifts() {
  const insets = useSafeAreaInsets();
  const [streak, setStreak] = React.useState<number>(0);
  const [gifts, setGifts] = React.useState<Gift[]>([]);

  React.useEffect(() => {
    (async () => {
      const res = await ensureTodayDailyGift();
      const [s, list] = await Promise.all([getStreak(), getUnclaimed()]);
      setStreak(res.created ? res.streak : s);
      setGifts(list);
    })();
  }, []);

  const handleClaim = async (id: string) => {
    const g = await claimGift(id);
    if (g) {
      const msg = g.discountPercent ? "Voucher saved" : `Added PKR ${g.amount} to wallet`;
      localizedToast({ type: "success", text1: "Gift claimed", text2: msg });
      const list = await getUnclaimed();
      setGifts(list);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText style={styles.heroTitle}>Daily Rewards</AppText>
            <AppText style={styles.heroSubtitle}>
              Check-in daily for 7 days to unlock one-time discount vouchers: 2%, 5%, 7%, 10%, 12%, 15%, and 20% on day 7 for any service.
            </AppText>
            <DailyStreak streak={streak} max={DefaultRewardPolicy.cycleDays} />
            <GiftsCalendar streak={streak} />
            <AppText style={styles.sectionTitle}>Unclaimed Gifts</AppText>
          </View>
        }
        data={gifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GiftCard gift={item} onClaim={handleClaim} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }}
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
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: Colors.text.primary,
  },
  heroSubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    color: Colors.text.primary,
  },
});
