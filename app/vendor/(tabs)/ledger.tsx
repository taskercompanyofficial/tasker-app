import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/Colors";
import { Shadows, Spacing, Typography } from "@/constants/DesignSystem";
import myAxios from "@/lib/axios.config";
import { useFocusEffect } from "expo-router";
import { VENDOR_RATES_URL } from "@/lib/api-endpoints";
import { useSession } from "@/context/ctx";

const { width: SW } = Dimensions.get("window");

type RateItem = {
  id: number;
  name: string;
  assigned_rate?: number;
  assigned_share?: number;
  is_overridden: boolean;
  base_rate?: number;
  base_share?: number;
};

export default function VendorLedgerRates() {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [services, setServices] = React.useState<RateItem[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchRates();
    }, []),
  );

  const fetchRates = async () => {
    try {
      const res = await myAxios.get(VENDOR_RATES_URL);
      const data = res.data?.data;
      if (data) {
        setServices(data.services || []);
      }
    } catch (e) {
      console.log("Rates fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRates();
  };

  const formatPKR = (val: number) => {
    return (
      "₨" +
      val.toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  };

  const ProfileStatusAlert = () => {
    const user = session.vendorUser;
    const isIncomplete = !user?.cnic || !user?.cnic_front_image || !user?.cnic_back_image;
    if (!isIncomplete) return null;
    return (
      <View style={styles.alertBar}>
        <View style={styles.alertIcon}>
          <Ionicons name="information-circle" size={16} color={Colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>Profile Incomplete</Text>
          <Text style={styles.alertText}>Complete your profile to start receiving jobs.</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.warning} />
      </View>
    );
  };

  const RateRow = ({ item }: { item: RateItem }) => (
    <View style={styles.rateCard}>
      {/* Left icon */}
      <View style={styles.rateIconWrap}>
        <Ionicons name="construct-outline" size={17} color={Colors.themes.provider.primary} />
      </View>

      {/* Info */}
      <View style={styles.rateInfo}>
        <Text style={styles.rateName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.rateMetaRow}>
          <Text style={styles.rateTypeLabel}>Service Payout</Text>
          {item.assigned_share !== undefined && item.assigned_share > 0 && (
            <View style={styles.sharePill}>
              <Text style={styles.sharePillText}>{item.assigned_share}% share</Text>
            </View>
          )}
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceBox}>
        <Text style={styles.priceValue}>
          {item.assigned_rate != null ? formatPKR(item.assigned_rate) : "—"}
        </Text>
        {item.is_overridden && (
          <View style={styles.customPill}>
            <Ionicons name="star" size={8} color={Colors.success} />
            <Text style={styles.customPillText}>Custom</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── HEADER ─── */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[Colors.themes.provider.primary, Colors.themes.provider.primaryDark]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* Decorative circles */}
          <View style={styles.hCircle1} />
          <View style={styles.hCircle2} />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerEyebrow}>YOUR RATES</Text>
              <Text style={styles.headerTitle}>Assigned Rates</Text>
              <Text style={styles.headerSubtitle}>
                {services.length > 0 ? `${services.length} services listed` : "Parent Service Ledger"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.refreshBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats mini row */}
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>{services.length}</Text>
              <Text style={styles.miniStatLabel}>Services</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>
                {services.filter((s) => s.is_overridden).length}
              </Text>
              <Text style={styles.miniStatLabel}>Custom Rates</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>
                {services.filter((s) => s.assigned_share && s.assigned_share > 0).length}
              </Text>
              <Text style={styles.miniStatLabel}>With Share</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* ─── CONTENT ─── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.themes.provider.primary} />
          <Text style={styles.loadingText}>Loading rates...</Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.themes.provider.primary}
            />
          }
          ListHeaderComponent={<ProfileStatusAlert />}
          renderItem={({ item }) => <RateRow item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={32} color={Colors.themes.provider.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>No Rates Assigned</Text>
              <Text style={styles.emptyText}>
                Your assigned service rates will appear here once configured.
              </Text>
            </View>
          }
          ListFooterComponent={
            services.length > 0 ? (
              <View style={styles.footerNote}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.text.tertiary} />
                <Text style={styles.footerNoteText}>Rates set by Tasker Company. Contact support for adjustments.</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2F7" },

  // ─── HEADER ────────────────────────────────────────────────────────────────
  headerWrapper: {
    backgroundColor: Colors.themes.provider.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    elevation: 6,
    shadowColor: Colors.themes.provider.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  hCircle1: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.05)", top: -40, right: -20,
  },
  hCircle2: {
    position: "absolute", width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(96,165,250,0.1)", bottom: 0, left: 60,
  },
  headerTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginTop: 12, marginBottom: 14,
  },
  headerEyebrow: {
    color: "rgba(255,255,255,0.5)", fontSize: 9,
    fontWeight: "700", letterSpacing: 1.5,
    textTransform: "uppercase", marginBottom: 4,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
  headerSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  refreshBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  miniStatsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 12, paddingVertical: 10,
  },
  miniStat: { flex: 1, alignItems: "center" },
  miniStatNum: { color: "#fff", fontSize: 15, fontWeight: "800" },
  miniStatLabel: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "500", marginTop: 2 },
  miniStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 4 },

  // ─── LIST ──────────────────────────────────────────────────────────────────
  list: { padding: 12, paddingBottom: 100 },

  // Alert bar
  alertBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A",
    borderRadius: 12, padding: 10, marginBottom: 10,
  },
  alertIcon: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: "#FEF3C7",
    alignItems: "center", justifyContent: "center",
  },
  alertTitle: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  alertText: { fontSize: 10, color: "#B45309", marginTop: 1 },

  // Rate card
  rateCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  rateIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.themes.provider.primary + "10",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  rateInfo: { flex: 1 },
  rateName: { fontSize: 13, fontWeight: "700", color: "#1E293B", lineHeight: 18 },
  rateMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  rateTypeLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  sharePill: {
    backgroundColor: Colors.success + "15", paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 6,
  },
  sharePillText: { fontSize: 9, fontWeight: "700", color: Colors.success },
  priceBox: { alignItems: "flex-end" },
  priceValue: { fontSize: 15, fontWeight: "900", color: Colors.themes.provider.primary },
  customPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: Colors.success + "15",
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginTop: 4,
  },
  customPillText: { fontSize: 9, fontWeight: "700", color: Colors.success },

  // States
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  loadingText: { fontSize: 12, color: Colors.text.secondary },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: Colors.themes.provider.background,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.themes.provider.accent + "30",
  },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  emptyText: {
    fontSize: 12, color: "#64748B", textAlign: "center",
    paddingHorizontal: 40, lineHeight: 18,
  },

  // Footer
  footerNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    marginTop: 16, paddingHorizontal: 4,
  },
  footerNoteText: { flex: 1, fontSize: 10, color: Colors.text.tertiary, lineHeight: 16 },
});
