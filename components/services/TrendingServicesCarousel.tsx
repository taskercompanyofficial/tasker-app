import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import type { ParentService } from "@/types/parent-service";
import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import TrendingServiceCard from "./TrendingServiceCard";
import { useLanguage } from "@/context/language-context";
import AppText from "@/components/common/AppText";

type Props = {
  title?: string;
  items: ParentService[];
  loading?: boolean;
  onViewAll?: () => void;
};

export default function TrendingServicesCarousel({ title, items, loading = false, onViewAll }: Props) {
  const { t } = useLanguage();
  const displayTitle = title || t.customer.home.trendingServices;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText style={styles.title}>{displayTitle}</AppText>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <AppText style={styles.viewAll}>{t.common.viewAll}</AppText>
          </TouchableOpacity>
        )}
      </View>
      {loading ? null : items.length === 0 ? (
        <View style={styles.empty}>
          <AppText style={styles.emptyText}>{t.common.noTrendingServices}</AppText>
        </View>
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
          renderItem={({ item, index }) => (
            <View style={{ width: 290 }}>
              <TrendingServiceCard item={item} index={index} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  viewAll: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
  },
  empty: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
