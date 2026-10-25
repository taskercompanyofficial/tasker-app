import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import { ServicesGridSkeleton, SheetServicesListSkeleton } from "@/components/Skeleton";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { Category } from "@/types/category";
import { Service } from "@/types/service";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const SHEET_PADDING = Spacing.md; // 16
const SHEET_CONTENT_WIDTH = width - SHEET_PADDING * 2;
const GRID_GAP = 10;
const GRID_CARD_WIDTH = Math.floor((SHEET_CONTENT_WIDTH - GRID_GAP * 2) / 3);

interface CategoryServicesBottomSheetProps {
  bottomSheetModalRef: React.RefObject<BottomSheetModal | null>;
  activeCategory: Category | null;
  services: Service[];
  loading: boolean;
  onSelectService: (service: Service) => void;
}

export default function CategoryServicesBottomSheet({
  bottomSheetModalRef,
  activeCategory,
  services,
  loading,
  onSelectService,
}: CategoryServicesBottomSheetProps) {
  // User Requirement: "grid view or list view option and also defaut by we show in grid"
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const snapPoints = useMemo(() => ["70%", "92%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    []
  );

  // Filter services by in-sheet search query
  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        activeCategory?.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, services, activeCategory]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      enableDynamicSizing={false}
      keyboardBlurBehavior="restore"
      backgroundStyle={styles.bottomSheetBackground}
      containerStyle={styles.modalContainer}
      style={styles.modalSheet}
    >
      <View style={styles.sheetInner}>
        {/* 1. Sheet Top Search & Cancel Row */}
        <View style={styles.sheetSearchRow}>
          <View style={styles.sheetSearchInputWrap}>
            <Ionicons
              name="search"
              size={16}
              color={Colors.text.tertiary}
              style={{ marginRight: 6 }}
            />
            <TextInput
              style={styles.sheetSearchInput}
              placeholder={`Search in ${activeCategory?.name || "category"}...`}
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name="close-circle"
                  size={15}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.sheetCancelBtn}
            onPress={() => bottomSheetModalRef.current?.dismiss()}
            activeOpacity={0.7}
          >
            <AppText style={styles.sheetCancelText}>Cancel</AppText>
          </TouchableOpacity>
        </View>

        {/* 2. Category Title, Count & Grid/List View Toggle */}
        <View style={styles.sheetCategoryHeader}>
          <View style={styles.sheetCategoryInfo}>
            <AppText style={styles.sheetCategoryTitle} numberOfLines={1}>
              {activeCategory?.name?.toUpperCase()}
            </AppText>
            <AppText style={styles.sheetCategoryCount}>
              {filteredServices.length}{" "}
              {filteredServices.length === 1 ? "Service" : "Services"}
            </AppText>
          </View>

          {/* View Mode Toggle Pill (Grid vs List) */}
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === "grid" && styles.viewToggleBtnActive,
              ]}
              onPress={() => setViewMode("grid")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid"
                size={15}
                color={
                  viewMode === "grid"
                    ? Colors.neutral.white
                    : Colors.text.tertiary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                viewMode === "list" && styles.viewToggleBtnActive,
              ]}
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="list"
                size={16}
                color={
                  viewMode === "list"
                    ? Colors.neutral.white
                    : Colors.text.tertiary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Scrollable Services Container (Grid View or List View) */}
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            viewMode === "grid" ? (
              <ServicesGridSkeleton count={6} />
            ) : (
              <SheetServicesListSkeleton count={5} />
            )
          ) : filteredServices.length === 0 ? (
            <View style={styles.sheetEmptyBox}>
              <Ionicons
                name="search-outline"
                size={28}
                color={Colors.text.tertiary}
              />
              <AppText style={styles.sheetEmptyText}>
                No services matching "{searchQuery}"
              </AppText>
            </View>
          ) : viewMode === "grid" ? (
            /* GRID VIEW (Default) */
            <View style={styles.sheetGridContainer}>
              {filteredServices.map((service) => {
                const imageUrl = service.image
                  ? getImageUrl(service.image)
                  : null;

                return (
                  <TouchableOpacity
                    key={service.slug || service.name}
                    style={styles.sheetGridCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      bottomSheetModalRef.current?.dismiss();
                      onSelectService(service);
                    }}
                  >
                    <View style={styles.sheetGridImgWrap}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.sheetGridImg}
                          contentFit="contain"
                          transition={150}
                        />
                      ) : (
                        <Ionicons
                          name="construct-outline"
                          size={24}
                          color={Colors.themes.customer.primary}
                        />
                      )}
                    </View>

                    <AppText style={styles.sheetGridTitle} numberOfLines={2}>
                      {service.name.toUpperCase()}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* LIST VIEW */
            <View style={styles.sheetListContainer}>
              {filteredServices.map((service, index) => {
                const imageUrl = service.image
                  ? getImageUrl(service.image)
                  : null;

                return (
                  <TouchableOpacity
                    key={service.slug || service.name}
                    style={[
                      styles.sheetItemRow,
                      index === filteredServices.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      bottomSheetModalRef.current?.dismiss();
                      onSelectService(service);
                    }}
                  >
                    <View style={styles.sheetItemLeft}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.sheetItemLogo}
                          contentFit="contain"
                        />
                      ) : (
                        <View style={styles.sheetItemLogoFallback}>
                          <Ionicons
                            name="construct-outline"
                            size={16}
                            color={Colors.themes.customer.primary}
                          />
                        </View>
                      )}

                      <View style={styles.sheetItemTextGroup}>
                        <AppText
                          style={styles.sheetItemTitle}
                          numberOfLines={1}
                        >
                          {service.name.toUpperCase()}
                        </AppText>
                      </View>
                    </View>

                    <DirectionalIcon
                      name="chevron-forward"
                      size={14}
                      color={Colors.text.tertiary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    zIndex: 99999,
    elevation: 99999,
  },
  modalSheet: {
    zIndex: 99999,
    elevation: 99999,
  },
  bottomSheetBackground: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetInner: {
    flex: 1,
    paddingTop: 4,
  },
  sheetSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 10,
  },
  sheetSearchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F9",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    height: 38,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  sheetCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sheetCancelText: {
    fontSize: Typography.sizes.xs,
    color: Colors.themes.customer.primary,
    fontWeight: "700",
  },
  sheetCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray[100],
    backgroundColor: "#FAFAFA",
  },
  sheetCategoryInfo: {
    flex: 1,
    marginRight: 10,
  },
  sheetCategoryTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  sheetCategoryCount: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: "600",
    marginTop: 1,
  },
  viewToggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBEFF5",
    borderRadius: BorderRadius.full,
    padding: 3,
    gap: 2,
  },
  viewToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.themes.customer.primary,
  },
  sheetScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
  },
  /* Grid View Styles */
  sheetGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingTop: 4,
  },
  sheetGridCard: {
    width: GRID_CARD_WIDTH,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F8FAFC",
  },
  sheetGridImgWrap: {
    width: 52,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  sheetGridImg: {
    width: "100%",
    height: "100%",
  },
  sheetGridTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.primary,
    textAlign: "center",
    lineHeight: 14,
  },
  /* List View Styles */
  sheetListContainer: {
    paddingTop: 2,
  },
  sheetItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.gray[100],
  },
  sheetItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  sheetItemLogo: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    marginRight: 12,
  },
  sheetItemLogoFallback: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sheetItemTextGroup: {
    flex: 1,
  },
  sheetItemTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  sheetEmptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  sheetEmptyText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
