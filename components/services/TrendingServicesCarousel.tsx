import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import type { ParentService } from "@/types/parent-service";
import React from "react";
import { FlatList, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import TrendingServiceCard from "./TrendingServiceCard";

type Props = {
  title?: string;
  items: ParentService[];
  loading?: boolean;
  onViewAll?: () => void;
};

export default function TrendingServicesCarousel({ title = "Trending Services", items, loading = false, onViewAll }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? null : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No trending services</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={{ width: 280 }}>
              <TrendingServiceCard item={item} />
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
