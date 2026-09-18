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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/Colors";
import { Spacing, Shadows, Typography } from "@/constants/DesignSystem";
import myAxios from "@/lib/axios.config";
import { useFocusEffect } from "expo-router";
import { VENDOR_RATES_URL } from "@/lib/api-endpoints";
import { useSession } from "@/context/ctx";

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
        <Ionicons name="information-circle" size={20} color={Colors.warning} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.alertTitle}>Profile Incomplete</Text>
          <Text style={styles.alertText}>Please complete your profile to receive jobs.</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      </View>
    );
  };

  const RateRow = ({
    item,
  }: {
    item: RateItem;
  }) => (
    <View style={styles.rateCard}>
      <View
        style={[
          styles.cardIconWrap,
          {
            backgroundColor: Colors.themes.provider.primary + "10",
          },
        ]}
      >
        <Ionicons
          name="construct-outline"
          size={20}
          color={Colors.themes.provider.primary}
        />
      </View>

      <View style={styles.rateInfo}>
        <Text style={styles.rateName}>{item.name}</Text>
        <Text style={styles.rateType}>Service Payout</Text>
        {item.assigned_share !== undefined && item.assigned_share > 0 && (
          <View style={styles.shareBadge}>
            <Text style={styles.shareBadgeText}>{item.assigned_share}% Benefit Share</Text>
          </View>
        )}
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceValue}>
          {formatPKR(item.assigned_rate!)}
        </Text>
        {item.is_overridden && (
          <View style={styles.overrideBadge}>
            <Text style={styles.overrideText}>Custom Rate</Text>
          </View>
        )}
      </View>
    </View>
  );

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
              <Text style={styles.headerTitle}>Assigned Rates</Text>
              <Text style={styles.headerSubtitle}>Parent Service Ledger</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshCircle}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={Colors.themes.provider.primary}
          />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.themes.provider.primary}
            />
          }
          ListHeaderComponent={<ProfileStatusAlert />}
          renderItem={({ item }) => (
            <RateRow item={item} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={Colors.text.quaternary}
              />
              <Text style={styles.emptyText}>No rates assigned yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  headerWrapper: {
    backgroundColor: Colors.themes.provider.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    ...Shadows.md,
  },
  headerGradient: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 20,
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
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: Typography.sizes.xs,
  },
  refreshCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: "#fff",
  },
  activeTabText: {
    color: Colors.themes.provider.primary,
  },
  list: {
    padding: Spacing.md,
    gap: 12,
    paddingTop: 16,
  },
  alertBar: {
    backgroundColor: Colors.warning + "15",
    borderWidth: 1,
    borderColor: Colors.warning + "30",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  rateCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...Shadows.sm,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rateInfo: {
    flex: 1,
  },
  rateName: {
    fontSize: 15,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
  },
  rateType: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
    textTransform: "uppercase",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.provider.primary,
  },
  shareBadge: {
    backgroundColor: Colors.success + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  shareBadgeText: {
    fontSize: Typography.sizes.xs * 0.75,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
    textTransform: "uppercase",
  },
  overrideBadge: {
    backgroundColor: Colors.success + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  overrideText: {
    fontSize: 8,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
    textTransform: "uppercase",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 12,
    color: Colors.text.tertiary,
    fontSize: 14,
  },
});
