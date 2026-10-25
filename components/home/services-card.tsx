import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import AppText from "@/components/common/AppText";
import { useLanguage } from "@/context/language-context";
import { localizeCategoryDescription } from "@/lib/i18n/category-copy";
import getImageUrl from "@/lib/utils";
import { Category } from "@/types/category";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const CARD_SPACING = 8;
const SERVICES_PER_ROW = 3;

export default function ServicesCard({ data }: { data?: Category }) {
  const { t, language } = useLanguage();
  const { width } = useWindowDimensions();
  const viewportWidth = width - Spacing.md * 2;
  const services = data?.services || [];

  const pages = useMemo(() => {
    const arr = [];
    // Show 6 services per page (3 per row, 2 rows)
    for (let i = 0; i < services.length; i += 6) {
      arr.push(services.slice(i, i + 6));
    }
    return arr;
  }, [services]);

  const [pageIndex, setPageIndex] = useState(0);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / viewportWidth);
      setPageIndex(Math.max(0, idx));
    },
    [viewportWidth]
  );

  const renderPage = useCallback(
    ({ item }: { item: typeof services }) => {
      const pageRows: typeof services[] = [];
      for (let i = 0; i < item.length; i += SERVICES_PER_ROW) {
        pageRows.push(item.slice(i, i + SERVICES_PER_ROW));
      }

      return (
        <View style={[styles.page, { width: viewportWidth }]}>
          <View style={styles.imageContainer}>
            {pageRows.map((rowItems, rIdx) => (
              <View key={`row-${rIdx}`} style={styles.serviceRow}>
                {rowItems.map((service) => (
                  <TouchableOpacity
                    key={service.slug}
                    style={styles.serviceCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      router.push(`/customer/services/${service.slug}`);
                    }}
                  >
                    <Image
                      source={{ uri: getImageUrl(service.image) }}
                      style={styles.image}
                      contentFit="contain"
                    />
                    <AppText style={styles.imageText} numberOfLines={2}>
                      {service.name}
                    </AppText>
                  </TouchableOpacity>
                ))}
                {Array.from({ length: SERVICES_PER_ROW - rowItems.length }).map(
                  (_, pIdx) => (
                    <View
                      key={`placeholder-${pIdx}`}
                      style={styles.serviceCardPlaceholder}
                    />
                  )
                )}
              </View>
            ))}
          </View>
        </View>
      );
    },
    [viewportWidth]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <AppText style={styles.title}>{data?.name}</AppText>
          <AppText style={styles.description} numberOfLines={1}>
            {data?.description
              ? localizeCategoryDescription(data.description, language)
              : ""}
          </AppText>
        </View>
        {data?.slug && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push(`/customer/(tabs)/${data.slug}` as any)}
          >
            <AppText style={styles.viewAllText}>{t.common.viewAll}</AppText>
          </TouchableOpacity>
        )}
      </View>

      {services.length === 0 ? (
        <View style={styles.noServicesContainer}>
          <AppText style={styles.noServicesText}>
            {t.common.noServicesAvailable}
          </AppText>
        </View>
      ) : (
        <FlatList
          horizontal
          pagingEnabled
          data={pages.length ? pages : [services]}
          keyExtractor={(_, idx) => String(idx)}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          renderItem={renderPage}
        />
      )}
      {pages.length > 1 && (
        <View style={styles.pagination}>
          {pages.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, idx === pageIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  viewAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.themes.customer.primary + "10",
    borderRadius: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
  },
  page: {},
  imageContainer: {
    flexDirection: "column",
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: CARD_SPACING,
    marginBottom: CARD_SPACING,
  },
  serviceCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.background.tertiary,
    padding: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.border.light,
    minHeight: 96,
  },
  serviceCardPlaceholder: {
    flex: 1,
  },
  image: {
    width: 56,
    height: 56,
    marginBottom: 6,
  },
  imageText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    lineHeight: 14,
  },
  noServicesText: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  noServicesContainer: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  pagination: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.gray[200],
  },
  dotActive: {
    backgroundColor: Colors.text.primary,
  },
});
