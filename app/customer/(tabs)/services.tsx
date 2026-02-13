import CheckoutModal from "@/components/checkout/CheckoutModal";
import Loader from "@/components/Loader";
import ParentServiceCard from "@/components/services/ParentServiceCard";
import NotificationBell from "@/components/common/NotificationBell";
import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography } from "@/constants/Styles";
import { PARENT_SERVICE_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { ParentService } from "@/types/parent-service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ServicesPage() {
  const [services, setServices] = useState<ParentService[]>([]);
  const [filteredServices, setFilteredServices] = useState<ParentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<{
    [key: number]: number;
  }>({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const fetchData = async () => {
    try {
      const servicesRes = await myAxios.get(PARENT_SERVICE_URL);
      const fetchedServices = servicesRes.data.data || [];

      setServices(fetchedServices);
      setFilteredServices(fetchedServices);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterServices(query);
  };

  const filterServices = (query: string) => {
    let filtered = services;

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query.toLowerCase()) ||
          service.description?.toLowerCase().includes(query.toLowerCase()),
      );
    }

    setFilteredServices(filtered);
  };

  const updateQuantity = (serviceId: number, change: number) => {
    setSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      const newValue = Math.max(0, current + change);
      if (newValue === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newValue };
    });
  };

  const calculateTotal = () => {
    return Object.entries(selectedServices).reduce((total, [id, quantity]) => {
      const service = services.find((s) => s.id === parseInt(id));
      if (!service) return total;
      const price = service.price;
      const discount = service.discount || 0;
      const discountedPrice =
        service.discount_type === "percentage"
          ? price * (1 - discount / 100)
          : price - discount;
      return total + discountedPrice * quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(selectedServices).reduce((sum, qty) => sum + qty, 0);
  };

  const getCheckoutItems = () => {
    return Object.entries(selectedServices).map(([id, quantity]) => {
      const service = services.find((s) => s.id === parseInt(id));
      return {
        serviceId: parseInt(id),
        serviceName: service?.name || "",
        quantity,
        price: service?.price || 0,
        discount: service?.discount || 0,
        discountType: service?.discount_type || "percentage",
      };
    });
  };

  const handleCheckout = () => {
    setShowCheckoutModal(true);
  };

  const renderServiceCard = ({ item }: { item: ParentService }) => (
    <ParentServiceCard
      service={item}
      quantity={selectedServices[item.id] || 0}
      onUpdateQuantity={(change) => updateQuantity(item.id, change)}
    />
  );

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Our Services</Text>
          <Text style={styles.headerSubtitle}>
            {filteredServices.length} services available
          </Text>
        </View>
        <NotificationBell />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Services List */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        style={styles.servicesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={64}
              color={Colors.text.tertiary}
            />
            <Text style={styles.emptyTitle}>No Services Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Try adjusting your search"
                : "No services available at the moment"}
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery("");
                  setFilteredServices(services);
                }}
              >
                <Text style={styles.clearButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Bottom Checkout Bar */}
      {getTotalItems() > 0 && (
        <View style={styles.checkoutBar}>
          <View style={styles.checkoutInfo}>
            <View style={styles.itemsCount}>
              <Ionicons name="cart" size={20} color={Colors.text.secondary} />
              <Text style={styles.itemsCountText}>
                {getTotalItems()} item(s)
              </Text>
            </View>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>
                ₨{Math.round(calculateTotal())}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={Colors.neutral.white}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        visible={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        items={getCheckoutItems()}
        totalAmount={calculateTotal()}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
  },
  listContainer: {
    padding: Spacing.sm,
    paddingBottom: 100,
  },
  servicesList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  clearButton: {
    backgroundColor: Colors.themes.customer.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  clearButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
  },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  checkoutInfo: {
    marginBottom: Spacing.sm,
  },
  itemsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 4,
  },
  itemsCountText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: Typography.sizes.xxl,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  checkoutButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.base,
    fontWeight: "700",
  },
});
