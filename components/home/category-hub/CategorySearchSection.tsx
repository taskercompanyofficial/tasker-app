import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing, Typography } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { Service } from "@/types/service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface SearchResultItem {
  categoryName: string;
  service: Service;
}

interface CategorySearchSectionProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchResults: SearchResultItem[];
  placeholderText?: string;
  onOpenFilter?: () => void;
  onSelectService: (service: Service) => void;
}

export default function CategorySearchSection({
  searchQuery,
  onSearchChange,
  searchResults,
  placeholderText,
  onOpenFilter,
  onSelectService,
}: CategorySearchSectionProps) {
  const isSearching = searchQuery.trim().length > 0;

  const handleClear = () => {
    onSearchChange("");
    Keyboard.dismiss();
  };

  return (
    <View style={styles.searchWrapper}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={Colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholderText || "Search services..."}
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={onSearchChange}
          />

          {isSearching ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={16} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ) : (
            onOpenFilter && (
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={onOpenFilter}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={Colors.themes.customer.primary}
                />
              </TouchableOpacity>
            )
          )}
        </View>

        {isSearching && (
          <TouchableOpacity
            style={styles.searchCancelBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <AppText style={styles.searchCancelBtnText}>Cancel</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Live Search Results Dropdown */}
      {isSearching && (
        <View style={styles.searchDropdownCard}>
          <View style={styles.searchDropdownHeader}>
            <AppText style={styles.searchDropdownCount}>
              {searchResults.length} {searchResults.length === 1 ? "Result" : "Results"} found
            </AppText>
            <TouchableOpacity onPress={handleClear}>
              <AppText style={styles.searchDropdownCancel}>Clear</AppText>
            </TouchableOpacity>
          </View>

          {searchResults.length === 0 ? (
            <View style={styles.searchDropdownEmpty}>
              <Ionicons name="search-outline" size={24} color={Colors.text.tertiary} />
              <AppText style={styles.searchDropdownEmptyText}>
                No services matching "{searchQuery}"
              </AppText>
            </View>
          ) : (
            <ScrollView
              style={styles.searchDropdownList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {searchResults.map(({ categoryName, service }) => (
                <TouchableOpacity
                  key={`${service.slug || service.name}`}
                  style={styles.searchDropdownItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleClear();
                    onSelectService(service);
                  }}
                >
                  <View style={styles.searchDropdownItemLeft}>
                    {service.image ? (
                      <Image
                        source={{ uri: getImageUrl(service.image) }}
                        style={styles.searchDropdownImg}
                        contentFit="contain"
                      />
                    ) : (
                      <View style={styles.searchDropdownPlaceholder}>
                        <Ionicons
                          name="construct-outline"
                          size={16}
                          color={Colors.themes.customer.primary}
                        />
                      </View>
                    )}
                    <View style={styles.searchDropdownTextGroup}>
                      <AppText style={styles.searchDropdownTitle} numberOfLines={1}>
                        {categoryName.toUpperCase()} - {service.name.toUpperCase()}
                      </AppText>
                    </View>
                  </View>
                  <DirectionalIcon
                    name="chevron-forward"
                    size={16}
                    color={Colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    position: "relative",
    zIndex: 50,
    elevation: 0,
    shadowOpacity: 0,
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F6F9",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
  },
  searchCancelBtn: {
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchCancelBtnText: {
    color: Colors.neutral.white,
    fontWeight: "700",
    fontSize: Typography.sizes.xs,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 6,
  },
  filterBtn: {
    padding: 6,
  },
  searchDropdownCard: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.gray[200],
    zIndex: 9999,
    maxHeight: 280,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: "hidden",
  },
  searchDropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray[200],
  },
  searchDropdownCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: "700",
  },
  searchDropdownCancel: {
    fontSize: Typography.sizes.xs,
    color: Colors.themes.customer.primary,
    fontWeight: "700",
  },
  searchDropdownEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 6,
  },
  searchDropdownEmptyText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  searchDropdownList: {
    maxHeight: 220,
  },
  searchDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.gray[100],
  },
  searchDropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  searchDropdownImg: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginRight: 10,
  },
  searchDropdownPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.neutral.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  searchDropdownTextGroup: {
    flex: 1,
  },
  searchDropdownTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.text.primary,
  },
});
