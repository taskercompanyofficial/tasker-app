import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Shadows, Spacing, Typography } from "@/constants/DesignSystem";
import { VENDOR_EARNINGS_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { useSession } from "@/context/ctx";

type VendorTxn = {
  id: string;
  type: "credit" | "debit";
  title: string;
  date: string;
  amount: number;
  category: string;
  status?: string;
  work_order_number?: string;
  running_balance: number;
  children?: any[];
};

type Summary = {
  total_completed_jobs: number;
  total_service_revenue: number;
  this_month_jobs: number;
  this_month_revenue: number;
  active_jobs: number;
  net_balance: number;
  total_paid: number;
  total_received: number;
  period_earned: number;
  period_debited: number;
};

export default function VendorEarnings() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [txns, setTxns] = React.useState<VendorTxn[]>([]);
  const [summary, setSummary] = React.useState<Summary>({
    total_completed_jobs: 0,
    total_service_revenue: 0,
    this_month_jobs: 0,
    this_month_revenue: 0,
    active_jobs: 0,
    net_balance: 0,
    total_paid: 0,
    total_received: 0,
    period_earned: 0,
    period_debited: 0,
  });
  const [filter, setFilter] = React.useState<"all" | "credit" | "debit">("all");

  // Date range filter
  type DatePreset = "all" | "this_month" | "last_month" | "this_year" | "custom";
  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const getPresetDates = (preset: DatePreset): { from: string; to: string } => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (preset === "this_month") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(from), to: fmt(now) };
    }
    if (preset === "last_month") {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(from), to: fmt(to) };
    }
    if (preset === "this_year") {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: fmt(from), to: fmt(now) };
    }
    return { from: "", to: "" };
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEarnings();
    }, []),
  );

  const fetchEarnings = async (from = dateFrom, to = dateTo) => {
    try {
      const params: Record<string, string> = {};
      if (from) params.date_from = from;
      if (to)   params.date_to   = to;
      const res = await myAxios.get(VENDOR_EARNINGS_URL, { params });
      const data = res.data?.data;
      if (data?.summary) setSummary(data.summary);
      if (Array.isArray(data?.transactions)) setTxns(data.transactions);
    } catch (e) {
      console.log("Earnings fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") { setShowDatePicker(true); return; }
    const { from, to } = getPresetDates(preset);
    setDateFrom(from);
    setDateTo(to);
    setRefreshing(true);
    setLoading(true);
    fetchEarnings(from, to);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const filtered = React.useMemo(() => {
    if (filter === "all") return txns;
    return txns.filter((t) => t.type === filter);
  }, [txns, filter]);

  const formatPKR = (val: number) => {
    return (
      "₨" +
      Math.abs(val).toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const getTxnIcon = (cat: string) => {
    switch (cat) {
      case "grouped_bill_charge":
        return { name: "layers-outline", color: Colors.info };
      case "installation_fee":
        return { name: "construct-outline", color: Colors.success };
      case "profit_share":
        return { name: "trending-up-outline", color: Colors.success };
      case "profit_share_adjustment":
        return { name: "trending-down-outline", color: Colors.warning };
      case "payout":
        return { name: "cash-outline", color: Colors.error };
      case "advance_payment":
        return { name: "wallet-outline", color: Colors.info };
      default:
        return { name: "receipt-outline", color: Colors.text.secondary };
    }
  };

  const TxnRow = ({ txn }: { txn: VendorTxn }) => {
    const isCredit = txn.type === "credit";
    const icon = getTxnIcon(txn.category);
    const hasChildren = txn.children && txn.children.length > 0;
    const [expanded, setExpanded] = React.useState(false);

    return (
      <View style={[styles.txnCardWrapper, expanded && styles.txnCardWrapperExpanded]}>
        <TouchableOpacity 
          activeOpacity={hasChildren ? 0.7 : 1}
          onPress={() => hasChildren && setExpanded(!expanded)}
          style={[styles.txnContainer, expanded && styles.txnContainerExpanded]}
        >
          <View
            style={[styles.txnIconWrap, { backgroundColor: icon.color + "15" }]}
          >
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>

          <View style={styles.txnMain}>
            <View style={styles.txnTitleRow}>
              <Text style={styles.txnTitle} numberOfLines={1}>
                {txn.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[
                    styles.txnAmount,
                    { color: isCredit ? Colors.success : Colors.error },
                  ]}
                >
                  {isCredit ? "+" : "-"}
                  {formatPKR(txn.amount)}
                </Text>
                {hasChildren && (
                  <Ionicons 
                    name={expanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={Colors.text.tertiary} 
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </View>

            <View style={styles.txnMetaRow}>
              <Text style={styles.txnDate}>
                {new Date(txn.date).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <View style={styles.txnSubMeta}>
                {txn.work_order_number && (
                  <View style={styles.woTag}>
                    <Text style={styles.woText}>#{txn.work_order_number}</Text>
                  </View>
                )}
                {txn.running_balance !== undefined && (
                  <Text style={styles.runningBalance}>
                    Bal: {formatPKR(txn.running_balance)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {expanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {txn.children!.map((child, idx) => {
              const cCredit = child.type === "credit";
              const cIcon = getTxnIcon(child.category);
              return (
                <View key={child.id} style={[styles.childRow, idx < txn.children!.length - 1 && styles.childBorder]}>
                  <View style={{ width: 16, alignItems: "center", marginRight: 8 }}>
                    <Ionicons name="return-down-forward" size={14} color={Colors.text.tertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childTitle} numberOfLines={2}>{child.title}</Text>
                    <Text style={styles.childDate}>
                      {new Date(child.date).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short"
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.childAmount, { color: cCredit ? Colors.success : Colors.error }]}>
                    {cCredit ? "+" : "-"}{formatPKR(child.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const ProfileStatusAlert = () => {
    const user = session.vendorUser;
    const isIncomplete = !user?.cnic || !user?.cnic_front_image || !user?.cnic_back_image;

    if (!isIncomplete) return null;

    return (
      <View style={styles.alertBar}>
        <Ionicons name="information-circle" size={20} color={Colors.warning} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.alertTitle}>Profile Incomplete</Text>
          <Text style={styles.alertText}>Please complete your profile to receive jobs.</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[
            Colors.themes.provider.primary,
            Colors.themes.provider.primaryDark,
          ]}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Earnings</Text>
              <Text style={[styles.headerSubtitle, { opacity: 0.8 }]}>
                Total Revenue Share
              </Text>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              activeOpacity={0.7}
              style={styles.refreshCircle}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="refresh-outline" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Big balance number — positive = company owes vendor, negative = vendor owes company */}
          <View style={styles.summaryValueContainer}>
            <Text style={styles.currencySymbol}>₨</Text>
            <Text style={[
              styles.totalValue,
              { color: summary.net_balance >= 0 ? '#fff' : '#FFB3B3' }
            ]}>
              {Math.abs(summary.net_balance).toLocaleString("en-PK")}
            </Text>
          </View>
          <View style={styles.balanceStatusBadge}>
            <Ionicons
              name={summary.net_balance >= 0 ? "arrow-up-circle" : "arrow-down-circle"}
              size={12}
              color={summary.net_balance >= 0 ? '#A5F3A5' : '#FFB3B3'}
            />
            <Text style={[styles.balanceStatusText, { color: summary.net_balance >= 0 ? '#A5F3A5' : '#FFB3B3' }]}>
              {summary.net_balance >= 0
                ? `Company owes you ₨${Math.abs(summary.net_balance).toLocaleString('en-PK')}`
                : `You owe company ₨${Math.abs(summary.net_balance).toLocaleString('en-PK')}`
              }
            </Text>
          </View>

          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.qsLabel}>Total Credited</Text>
              <Text style={styles.qsValue}>{formatPKR(summary.total_service_revenue)}</Text>
            </View>
            <View style={styles.qsDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.qsLabel}>Total Debited</Text>
              <Text style={styles.qsValue}>{formatPKR(summary.total_paid)}</Text>
            </View>
            <View style={styles.qsDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.qsLabel}>Active Jobs</Text>
              <Text style={styles.qsValue}>{summary.active_jobs}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator
            size="large"
            color={Colors.themes.provider.primary}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.themes.provider.primary}
              />
            }
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <ProfileStatusAlert />
                {/* Date Range Filter */}
                <View style={styles.dateRangeRow}>
                  <View style={styles.dateInputWrap}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.text.tertiary} />
                    <TextInput
                      style={styles.dateInput}
                      placeholder="From (YYYY-MM-DD)"
                      placeholderTextColor={Colors.text.tertiary}
                      value={dateFrom}
                      onChangeText={setDateFrom}
                      keyboardType="numeric"
                      maxLength={10}
                      returnKeyType="done"
                      onEndEditing={() => { if (dateFrom || dateTo) { setRefreshing(true); setLoading(true); fetchEarnings(dateFrom, dateTo); }}}
                    />
                  </View>
                  <View style={styles.dateInputWrap}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.text.tertiary} />
                    <TextInput
                      style={styles.dateInput}
                      placeholder="To (YYYY-MM-DD)"
                      placeholderTextColor={Colors.text.tertiary}
                      value={dateTo}
                      onChangeText={setDateTo}
                      keyboardType="numeric"
                      maxLength={10}
                      returnKeyType="done"
                      onEndEditing={() => { if (dateFrom || dateTo) { setRefreshing(true); setLoading(true); fetchEarnings(dateFrom, dateTo); }}}
                    />
                  </View>
                  {(dateFrom || dateTo) && (
                    <TouchableOpacity
                      style={styles.dateClearBtn}
                      onPress={() => { setDateFrom(""); setDateTo(""); setRefreshing(true); setLoading(true); fetchEarnings("", ""); }}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Section Title & Type Filter Chips */}
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Activities</Text>
                  <View style={styles.filterRow}>
                    <FilterTab active={filter === "all"} label="All" onPress={() => setFilter("all")} />
                    <FilterTab active={filter === "credit"} label="Credits" onPress={() => setFilter("credit")} />
                    <FilterTab active={filter === "debit"} label="Debits" onPress={() => setFilter("debit")} />
                  </View>
                </View>
              </View>
            }
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            renderItem={({ item }) => <TxnRow txn={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={48}
                  color={Colors.text.tertiary}
                />
                <Text style={styles.emptyText}>No activity found</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

function FilterTab({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.filterTab, active && styles.filterTabActive]}
    >
      <Text
        style={[styles.filterTabText, active && styles.filterTabTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
  },
  headerWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: Colors.themes.provider.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  headerGradient: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 25,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: "#fff",
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  summaryValueContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  balanceStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  balanceStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  currencySymbol: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    marginTop: 6,
    marginRight: 4,
  },
  totalValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: Typography.weights.extrabold,
  },
  refreshCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: "center",
  },
  quickStatItem: {
    flex: 1,
    alignItems: "center",
  },
  qsLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  qsValue: {
    color: "#fff",
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  qsDivider: {
    width: 1,
    height: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  listHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: 15,
  },
  alertBar: {
    backgroundColor: Colors.warning + "15",
    borderWidth: 1,
    borderColor: Colors.warning + "30",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B45309",
  },
  alertText: {
    fontSize: 11,
    color: "#D97706",
    marginTop: 1,
  },
  secondaryStatsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  // 4 stat tiles grid
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray[100],
    ...Shadows.sm,
  },
  statTileValue: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.text.primary,
    textAlign: "center",
  },
  statTileLabel: {
    fontSize: 9,
    color: Colors.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  // Date filter
  dateFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray[100],
    borderWidth: 1,
    borderColor: Colors.neutral.gray[200],
  },
  dateChipActive: {
    backgroundColor: Colors.themes.provider.primary,
    borderColor: Colors.themes.provider.primary,
  },
  dateChipText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  dateChipTextActive: {
    color: "#fff",
  },
  dateRangeText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginBottom: 10,
    fontStyle: "italic",
  },
  // New breakdown card replacing secondaryStatsGrid
  balanceBreakdownCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    ...Shadows.sm,
  },
  balanceStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray[100],
  },
  breakdownStatusTitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  breakdownAmount: {
    fontSize: 20,
    fontWeight: "800",
  },
  breakdownRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 0,
  },
  breakdownItem: {
    flex: 1,
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  breakdownItemValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: Colors.neutral.gray[100],
    marginVertical: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
  },
  statValue: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
  },

  dateRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  dateInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.gray[200],
  },
  dateInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: "500",
    padding: 0,
  },
  dateClearBtn: {
    padding: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray[100],
  },
  filterTabActive: {
    backgroundColor: Colors.themes.provider.primary,
  },
  filterTabText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.semibold,
  },
  filterTabTextActive: {
    color: "#fff",
  },

  listContent: {
    paddingTop: 10,
    paddingHorizontal: Spacing.md,
  },
  separator: {
    height: 10,
  },
  txnCardWrapper: {
    marginBottom: 0,
    backgroundColor: "transparent",
    borderRadius: 15,
    ...Shadows.sm,
  },
  txnCardWrapperExpanded: {
    marginBottom: 8,
  },
  txnContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    // shadow is handled by wrapper now
  },
  txnContainerExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 1,
  },
  txnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txnMain: {
    flex: 1,
  },
  txnTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  txnTitle: {
    fontSize: 14,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: Typography.weights.bold,
  },
  txnMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txnDate: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  txnSubMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  woTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: 4,
  },
  woText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: Colors.text.secondary,
  },
  runningBalance: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.text.tertiary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    color: Colors.text.tertiary,
    fontSize: Typography.sizes.sm,
  },
  childrenContainer: {
    backgroundColor: Colors.neutral.gray[100],
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: -8, // Pulls the background up under the rounded corner of the main row
    paddingTop: 16, // Compensate for the pull up
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  childBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.gray[200],
  },
  childTitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  childDate: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  childAmount: {
    fontSize: 13,
    fontWeight: Typography.weights.bold,
    marginLeft: 12,
  },
});
