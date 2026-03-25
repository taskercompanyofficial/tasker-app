import Colors from "@/constants/Colors";
import { Spacing, Typography } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useEcho } from "@/context/EchoProvider";
import { ADDRESS_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NotificationBell from "../common/NotificationBell";
import { useRouter } from "expo-router";
import AddAddressForm from "./AddAddressForm";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { isConnected, connectionState } = useEcho();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const fetchAddress = async () => {
    try {
      const res = await myAxios.get(
        ADDRESS_URL + `?customer_id=${session.user?.id}`,
      );
      const addresses: Address[] = res.data.data || [];

      if (addresses.length > 0) {
        const def = addresses.find(a => a.is_default);
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
    setShowAddressSheet(false);
  };

  const handleSaveAddress = () => {
    fetchAddress();
  };

  const ConnectionStatus = () => {
    const isLive = isConnected;
    const isConnecting = connectionState === "connecting" || connectionState === "initialized";
    const dotColor = isLive ? Colors.success : isConnecting ? "#F59E0B" : Colors.error;
    const label = isLive ? "Live" : isConnecting ? "..." : "Offline";

    return (
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.statusText, { color: dotColor }]}>{label}</Text>
      </View>
    );
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
          <Text
            style={[
              styles.addressLabel,
              item.id === selectedAddress?.id && styles.addressLabelActive,
            ]}
          >
            {item.address_type.charAt(0).toUpperCase() +
              item.address_type.slice(1)}
          </Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address_line_1}
          </Text>
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
          {session.user?.avatar_url ? (
            <Image
              source={{ uri: session.user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {session.user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase() || "U"}
              </Text>
            </View>
          )}

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.greeting}>Hi, {firstName}! 👋</Text>
              <ConnectionStatus />
            </View>
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => setShowAddressSheet(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location"
                size={11}
                color={Colors.text.tertiary}
              />
              <Text style={styles.address} numberOfLines={1}>
                {selectedAddress?.address_line_1
                  ?.substring(0, 30)
                  .concat("...") || "Select address"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/customer/gifts")}
            activeOpacity={0.7}
            accessibilityLabel="Open Gifts"
          >
            <Ionicons name="gift-outline" size={18} color={Colors.themes.customer.primary} />
          </TouchableOpacity>
          <NotificationBell />
        </View>
      </View>

      {/* Address Bottom Sheet */}
      <Modal
        visible={showAddressSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressSheet(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddressSheet(false)}
        >
          <Pressable
            style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddressSheet(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Address List */}
            <FlatList
              data={userAddresses}
              renderItem={renderAddressItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={[styles.addressList, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}
              ListEmptyComponent={
                <Text style={styles.emptyAddressText}>No addresses found</Text>
              }
            />

            {/* Add New Address */}
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => {
                setShowAddressSheet(false);
                setTimeout(() => setShowAddressForm(true), 300);
              }}
            >
              <Ionicons
                name="add-circle"
                size={18}
                color={Colors.themes.customer.primary}
              />
              <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Address Form */}
      <AddAddressForm
        visible={showAddressForm}
        onClose={() => setShowAddressForm(false)}
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
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,

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
    maxHeight: "70%",
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  }
});
