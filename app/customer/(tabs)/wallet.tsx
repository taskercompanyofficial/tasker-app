import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, FlatList } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "@/components/Input";
import Toast from "react-native-toast-message";
import { getBalance as apiGetBalance, getTransactions as apiGetTxns, recharge as apiRecharge, refund as apiRefund, WalletTransaction } from "@/lib/wallet";
import BalanceCard from "@/components/wallet/BalanceCard";
import QuickActions from "@/components/wallet/QuickActions";
import TransactionItem from "@/components/wallet/TransactionItem";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/Button";

export default function Wallet() {
  const insets = useSafeAreaInsets();

  // Temporarily disable wallet — show Coming Soon
  const COMING_SOON = true;

  if (COMING_SOON) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.comingSoonContainer}>
          <View style={styles.comingSoonIconCircle}>
            <Ionicons name="wallet-outline" size={52} color={Colors.themes.customer.primary} />
          </View>
          <Text style={styles.comingSoonTitle}>Wallet</Text>
          <Text style={styles.comingSoonSubtitle}>Coming Soon</Text>
          <Text style={styles.comingSoonDesc}>
            We're working on an amazing wallet experience for you.{"\n"}Stay tuned!
          </Text>
          <View style={styles.comingSoonBadge}>
            <Ionicons name="construct-outline" size={14} color={Colors.themes.customer.primary} />
            <Text style={styles.comingSoonBadgeText}>Under Development</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const [balance, setBalance] = React.useState<number>(0);
  const [showRecharge, setShowRecharge] = React.useState<boolean>(false);
  const [showRefund, setShowRefund] = React.useState<boolean>(false);
  const [amount, setAmount] = React.useState<string>("");
  const [txns, setTxns] = React.useState<WalletTransaction[]>([]);

  React.useEffect(() => {
    (async () => {
      const [b, t] = await Promise.all([apiGetBalance(), apiGetTxns()]);
      setBalance(b);
      setTxns(t);
    })();
  }, []);

  const handlePreset = (val: number) => {
    setAmount(String(val));
  };

  const handleRecharge = async () => {
    const val = Number(amount);
    if (!val || val <= 0) {
      Toast.show({ type: "error", text1: "Enter a valid amount" });
      return;
    }
    const { balance: b, transactions } = await apiRecharge(val, "card");
    setBalance(b);
    setTxns(transactions);
    setShowRecharge(false);
    setAmount("");
    Toast.show({ type: "success", text1: "Wallet recharged" });
  };

  const handleRefund = async () => {
    const val = Number(amount);
    if (!val || val <= 0) {
      Toast.show({ type: "error", text1: "Enter a valid amount" });
      return;
    }
    const { balance: b, transactions } = await apiRefund(val);
    setBalance(b);
    setTxns(transactions);
    setShowRefund(false);
    setAmount("");
    Toast.show({ type: "success", text1: "Refund added" });
  };

  const renderTxn = ({ item }: { item: WalletTransaction }) => <TransactionItem txn={item} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topArea}>
        <BalanceCard balance={balance} />
        <QuickActions
          onRecharge={() => {
            setAmount("");
            setShowRecharge(true);
          }}
          onRefund={() => {
            setAmount("");
            setShowRefund(true);
          }}
        />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionAction}>View all</Text>
        </View>
      </View>
      <View style={styles.listWrap}>
        <FlatList
          data={txns}
          keyExtractor={(item) => item.id}
          renderItem={renderTxn}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal visible={showRecharge} transparent animationType="slide" onRequestClose={() => setShowRecharge(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRecharge(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Recharge Wallet</Text>
              <Pressable onPress={() => setShowRecharge(false)} style={styles.sheetClose}>
                <Ionicons name="close" size={20} color={Colors.text.primary} />
              </Pressable>
            </View>
            <View style={styles.amountRow}>
              <Pressable style={styles.amountPill} onPress={() => handlePreset(500)}><Text style={styles.amountPillText}>PKR 500</Text></Pressable>
              <Pressable style={styles.amountPill} onPress={() => handlePreset(1000)}><Text style={styles.amountPillText}>PKR 1000</Text></Pressable>
              <Pressable style={styles.amountPill} onPress={() => handlePreset(2000)}><Text style={styles.amountPillText}>PKR 2000</Text></Pressable>
            </View>
            <Input
              label="Amount"
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              theme="customer"
            />
            <View style={styles.payMethods}>
              <View style={styles.methodCard}>
                <Ionicons name="card" size={16} color={Colors.themes.customer.primary} />
                <Text style={styles.methodLabel}>Card</Text>
              </View>
              <View style={styles.methodCardDisabled}>
                <Ionicons name="cash-outline" size={16} color={Colors.text.tertiary} />
                <Text style={styles.methodLabelDisabled}>Bank</Text>
              </View>
            </View>
            <Button title="Continue" onPress={handleRecharge} fullWidth size="medium" />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showRefund} transparent animationType="slide" onRequestClose={() => setShowRefund(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRefund(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Refund to Wallet</Text>
              <Pressable onPress={() => setShowRefund(false)} style={styles.sheetClose}>
                <Ionicons name="close" size={20} color={Colors.text.primary} />
              </Pressable>
            </View>
            <Input
              label="Amount"
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              theme="customer"
            />
            <Button title="Add Refund" onPress={handleRefund} fullWidth size="medium" />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
  },
  topArea: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.themes.customer.primary + "0D",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  sectionAction: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  listWrap: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.neutral.gray[300],
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  sheetClose: {
    padding: 4,
  },
  amountRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  amountPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.neutral.gray[100],
  },
  amountPillText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: "600",
  },
  payMethods: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary,
    borderRadius: 12,
    backgroundColor: Colors.themes.customer.primary + "10",
  },
  methodCardDisabled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    backgroundColor: Colors.neutral.gray[100],
    opacity: 0.7,
  },
  methodLabel: {
    color: Colors.themes.customer.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  methodLabelDisabled: {
    color: Colors.text.secondary,
    fontWeight: "600",
    fontSize: 12,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  comingSoonIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.themes.customer.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  comingSoonSubtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
    marginBottom: Spacing.sm,
  },
  comingSoonDesc: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.themes.customer.primary + "12",
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary + "30",
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
  },
});
