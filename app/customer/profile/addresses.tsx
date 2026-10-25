import { localizedAlert } from "@/lib/i18n/localized-alert";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import AddAddressForm from "@/components/home/AddAddressForm";
import Loader from "@/components/Loader";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { ADDRESS_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Address {
  id: number;
  customer_id: number;
  address_type: "home" | "office" | "other";
  area_type: "residential" | "commercial" | "industrial" | "other";
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export default function MyAddressesPage() {
  const { session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const addAddressModalRef = useRef<BottomSheetModal>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, []),
  );

  const fetchAddresses = async () => {
    try {
      const res = await myAxios.get(
        ADDRESS_URL + `?customer_id=${session.user?.id}`,
      );
      setAddresses(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const handleDeleteAddress = (addressId: number) => {
    localizedAlert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await myAxios.delete(`${ADDRESS_URL}/${addressId}`);
              fetchAddresses();
              localizedAlert("Success", "Address deleted successfully");
            } catch (error) {
              localizedAlert("Error", "Failed to delete address");
            }
          },
        },
      ],
    );
  };

  const handleAddNew = () => {
    addAddressModalRef.current?.present();
  };

  const handleEditAddress = (_address: Address) => {
    addAddressModalRef.current?.present();
  };

  const handleSaveAddress = () => {
    fetchAddresses();
    addAddressModalRef.current?.dismiss();
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return "home";
      case "office":
        return "briefcase";
      default:
        return "location";
    }
  };

  const renderAddressCard = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressTypeContainer}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getAddressIcon(item.address_type) as any}
              size={20}
              color={Colors.themes.customer.primary}
            />
          </View>
          <AppText style={styles.addressType}>
            {item.address_type.charAt(0).toUpperCase() +
              item.address_type.slice(1)}
          </AppText>
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAddress(item)}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={Colors.themes.customer.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressContent}>
        <AppText style={styles.addressText}>{item.address_line_1}</AppText>
        {item.address_line_2 && (
          <AppText style={styles.addressText}>{item.address_line_2}</AppText>
        )}
        <AppText style={styles.addressText}>
          {item.city}, {item.state} {item.zip_code}
        </AppText>
        <AppText style={styles.addressText}>{item.country}</AppText>
      </View>

      <View style={styles.addressFooter}>
        <View style={styles.areaTypeBadge}>
          <AppText style={styles.areaTypeText}>{item.area_type}</AppText>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <Loader fullScreen />;
  }

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
        <AppText style={styles.headerTitle}>My Addresses</AppText>
        <TouchableOpacity onPress={handleAddNew} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.themes.customer.primary} />
        </TouchableOpacity>
      </View>

      {/* Addresses List */}
      <FlatList
        data={addresses}
        renderItem={renderAddressCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="location-outline"
              size={64}
              color={Colors.text.tertiary}
            />
            <AppText style={styles.emptyTitle}>No Addresses</AppText>
            <AppText style={styles.emptyText}>
              You haven&apos;t added any addresses yet.
            </AppText>
            <TouchableOpacity
              style={styles.addNewButton}
              onPress={handleAddNew}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={Colors.neutral.white}
              />
              <AppText style={styles.addNewButtonText}>Add Address</AppText>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Address Form Modal */}
      <AddAddressForm
        ref={addAddressModalRef}
        onSave={handleSaveAddress}
        customer_id={session.user?.id}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: Spacing.md,
  },
  addressCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  addressTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  addressType: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  addressActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  addressContent: {
    marginBottom: Spacing.sm,
  },
  addressText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  addressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  areaTypeBadge: {
    backgroundColor: Colors.neutral.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  areaTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.secondary,
    textTransform: "capitalize",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
  },
  addNewButtonText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
