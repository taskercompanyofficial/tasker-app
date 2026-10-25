import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import { SheetServicesListSkeleton } from "@/components/Skeleton";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { Service } from "@/types/service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface CategoryServicesGridProps {
  services: Service[];
  activeCategoryName?: string;
  loading: boolean;
  onOpenSheet: () => void;
  onSelectService: (service: Service) => void;
}

export default function CategoryServicesGrid({
  services,
  activeCategoryName,
  loading,
  onOpenSheet,
  onSelectService,
}: CategoryServicesGridProps) {
  return (
    <View style={styles.container}>
      {/* Services Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.servicesHeaderLeft}>
          <AppText style={styles.sectionTitle}>Services</AppText>
          {activeCategoryName && (
            <AppText style={styles.servicesSubtitle} numberOfLines={1}>
              in {activeCategoryName}
            </AppText>
          )}
        </View>

        {services.length > 0 && (
          <TouchableOpacity
            style={styles.viewSheetPill}
            onPress={onOpenSheet}
            activeOpacity={0.7}
          >
            <AppText style={styles.viewSheetText}>
              {services.length} {services.length === 1 ? "Option" : "Options"}
            </AppText>
            <DirectionalIcon
              name="chevron-forward"
              size={12}
              color={Colors.themes.customer.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Services List Content or Loading Shimmer */}
      {loading ? (
        <SheetServicesListSkeleton count={5} />
      ) : services.length === 0 ? (
        <View style={styles.noServicesContainer}>
          <Ionicons name="construct-outline" size={28} color={Colors.text.tertiary} />
          <AppText style={styles.noServicesTitle}>No services found</AppText>
          <AppText style={styles.noServicesSubtitle}>
            Services under {activeCategoryName || "this category"} will be available shortly.
          </AppText>
        </View>
      ) : (
        <View style={styles.servListContainer}>
          {services.map((service, index) => {
            const imageUrl = service.image ? getImageUrl(service.image) : null;
            const isLast = index === services.length - 1;

            return (
              <TouchableOpacity
                key={service.slug || service.name}
                style={[styles.servListItem, isLast && styles.servListItemLast]}
                activeOpacity={0.7}
                onPress={() => onSelectService(service)}
              >
                <View style={styles.servListLeft}>
                  {/* Complete Image Container (contentFit="contain", fully shown, no crop) */}
                  <View style={styles.servListImageWrap}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.servListImage}
                        contentFit="contain"
                        transition={150}
                      />
                    ) : (
                      <View style={styles.servListPlaceholder}>
                        <Ionicons
                          name="build-outline"
                          size={18}
                          color={Colors.themes.customer.primary}
                        />
                      </View>
                    )}
                  </View>

                  {/* Service Name & Optional Description (NO PRICE, clean, bold) */}
                  <View style={styles.servListContent}>
                    <AppText style={styles.servListTitle} numberOfLines={1}>
                      {service.name.toUpperCase()}
                    </AppText>
                    {service.description ? (
                      <AppText style={styles.servListDesc} numberOfLines={1}>
                        {service.description}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                {/* Right Arrow Chevron */}
                <DirectionalIcon
                  name="chevron-forward"
                  size={15}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  servicesHeaderLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  servicesSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    fontWeight: "600",
    flex: 1,
  },
  viewSheetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F4F6F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  viewSheetText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.themes.customer.primary,
  },
  /* Services List View (Replaced grid view as requested) */
  servListContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
  },
  servListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.gray[100],
  },
  servListItemLast: {
    borderBottomWidth: 0,
  },
  servListLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  servListImageWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    padding: 3,
  },
  servListImage: {
    width: "100%",
    height: "100%",
  },
  servListPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  servListContent: {
    flex: 1,
  },
  servListTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  servListDesc: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: 2,
    lineHeight: 14,
  },
  noServicesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  noServicesTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  noServicesSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    textAlign: "center",
    maxWidth: 240,
  },
});
