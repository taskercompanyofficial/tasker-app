import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { ADDRESS_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import getImageUrl from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationBell from "../common/NotificationBell";
import AddAddressForm from "./AddAddressForm";
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
  isActive?: boolean;
  is_default?: boolean;
}

export default function HomeHeader() {
  const { session } = useSession();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const rawCustomerAvatar =
    session.user?.avatar_url ||
    (session.user as any)?.active_avatar_url ||
    (session.user as any)?.profile_image ||
    null;
  const avatarUrl = rawCustomerAvatar ? getImageUrl(rawCustomerAvatar) : "";

  // Bottom Sheet hooks
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const addAddressFormRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const fetchAddress = async () => {
    try {
      const res = await myAxios.get(
        ADDRESS_URL + `?customer_id=${session.user?.id}`,
      );
      const addresses: Address[] = res.data.data || [];

      if (addresses.length > 0) {
        const def = addresses.find((a) => a.is_default);
        const chosen = def ?? addresses[0];
        chosen.isActive = true;
        setSelectedAddress(chosen);
      }

      setUserAddresses(addresses);
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, []);

  const userName = session.user?.name || "Guest";
  const firstName = userName.split(" ")[0];

  const handleAddressSelect = async (address: Address) => {
    try {
      await myAxios.post(`${ADDRESS_URL}/${address.id}/set-default`, {
        customer_id: session.user?.id,
      });
    } catch (e) {
      console.error("Failed to set default address", e);
    }
    const updatedAddresses = userAddresses.map((addr) => ({
      ...addr,
      isActive: addr.id === address.id,
      is_default: addr.id === address.id ? true : false,
    }));
    setUserAddresses(updatedAddresses);
    setSelectedAddress(address);
    bottomSheetModalRef.current?.dismiss();
  };

  const handleSaveAddress = () => {
    fetchAddress();
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={[
        styles.addressItem,
        item.id === selectedAddress?.id && styles.addressItemActive,
      ]}
      onPress={() => handleAddressSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.addressItemLeft}>
        <View
          style={[
            styles.addressIcon,
            item.id === selectedAddress?.id && styles.addressIconActive,
          ]}
        >
          <Ionicons
            name={
              item.address_type === "home"
                ? "home"
                : item.address_type === "office"
                  ? "briefcase"
                  : "location"
            }
            size={14}
            color={
              item.id === selectedAddress?.id
                ? Colors.themes.customer.primary
                : Colors.text.tertiary
            }
          />
        </View>
        <View style={styles.addressInfo}>
          <AppText
            style={[
              styles.addressLabel,
              item.id === selectedAddress?.id && styles.addressLabelActive,
            ]}
          >
            {item.address_type.charAt(0).toUpperCase() +
              item.address_type.slice(1)}
          </AppText>
          <AppText style={styles.addressText} numberOfLines={1}>
            {item.address_line_1}
          </AppText>
        </View>
      </View>
      {item.id === selectedAddress?.id && (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={Colors.themes.customer.primary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {/* User Avatar */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/customer/settings")}
          >
            {avatarUrl && !avatarError ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
                cachePolicy="disk"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={styles.avatar}>
                <AppText style={styles.avatarText}>
                  {session.user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase() || "U"}
                </AppText>
              </View>
            )}
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.userInfo}>
            <AppText style={styles.greeting}>
              {"Hi, "}{"\u2068"}{firstName}{"\u2069"}{"! 👋"}
            </AppText>
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => bottomSheetModalRef.current?.present()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location"
                size={11}
                color={Colors.text.tertiary}
              />
              <AppText style={styles.address} numberOfLines={1}>
                {selectedAddress?.address_line_1
                  ?.substring(0, 30)
                  .concat("...") || "Select address"}
              </AppText>
              <Ionicons
                name="chevron-down"
                size={12}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rightSection}>
          <NotificationBell />
        </View>
      </View>

      {/* Address Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        index={0}
        backgroundStyle={{ backgroundColor: Colors.neutral.white, borderRadius: 20 }}
        handleIndicatorStyle={{ backgroundColor: Colors.neutral.gray[300], width: 36 }}
      >
        <View style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 12) }}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <AppText style={styles.sheetTitle}>Select Address</AppText>
            <TouchableOpacity
              onPress={() => bottomSheetModalRef.current?.dismiss()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Address List */}
          <BottomSheetFlatList
            data={userAddresses}
            renderItem={renderAddressItem as any}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.addressList,
              { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
            ]}
            ListEmptyComponent={
              <AppText style={styles.emptyAddressText}>No addresses found</AppText>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => {
                  addAddressFormRef.current?.present();
                }}
              >
                <Ionicons
                  name="add-circle"
                  size={18}
                  color={Colors.themes.customer.primary}
                />
                <AppText style={styles.addAddressText}>Add New Address</AppText>
              </TouchableOpacity>
            }
          />
        </View>
      </BottomSheetModal>

      {/* Add Address Form */}
      <AddAddressForm
        ref={addAddressFormRef}
        onSave={handleSaveAddress}
        customer_id={session.user?.id}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.themes.customer.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.neutral.white,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: 1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  address: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  // Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: Colors.neutral.gray[300],
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  addressList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: Colors.neutral.gray[50],
    borderWidth: 1,
    borderColor: "transparent",
  },
  addressItemActive: {
    backgroundColor: Colors.themes.customer.primary + "10",
    borderColor: Colors.themes.customer.primary,
  },
  addressItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
  },
  addressIconActive: {
    backgroundColor: Colors.themes.customer.primary + "20",
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  addressLabelActive: {
    color: Colors.themes.customer.primary,
  },
  addressText: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.themes.customer.primary,
    borderStyle: "dashed",
  },
  addAddressText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
  },
  emptyAddressText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
  },
});
