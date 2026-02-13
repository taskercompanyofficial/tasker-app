import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import getImageUrl from "@/lib/utils";
import { Category } from "@/types/category";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

const { width } = Dimensions.get("window");
const VIEWPORT_WIDTH = width - Spacing.md * 2;
const SERVICES_PER_ROW = 4;
const CARD_SPACING = 6;
const CARD_WIDTH =
  (VIEWPORT_WIDTH - CARD_SPACING * (SERVICES_PER_ROW - 1)) /
  SERVICES_PER_ROW;

export default function ServicesCard({ data }: { data?: Category }) {
  const services = data?.services || [];
  const pages = useMemo(() => {
    const arr = [];
    for (let i = 0; i < services.length; i += 8) {
      arr.push(services.slice(i, i + 8));
    }
    return arr;
  }, [services]);
  const [pageIndex, setPageIndex] = useState(0);
  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / VIEWPORT_WIDTH);
      setPageIndex(Math.max(0, idx));
    },
    []
  );
  const renderPage = useCallback(
    ({ item }: { item: typeof services }) => (
      <View style={[styles.page, { width: VIEWPORT_WIDTH }]}>
        <View style={styles.imageContainer}>
          {item.map((service) => (
            <TouchableOpacity
              key={service.slug}
              style={styles.serviceCard}
              onPress={() => {
                router.push(`/customer/services/${service.slug}`);
              }}
            >
              <Image
                source={{ uri: getImageUrl(service.image) }}
                style={styles.image}
                contentFit="contain"
              />
              <Text style={styles.imageText} numberOfLines={2}>
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{data?.name}</Text>
      <Text style={styles.description}>{data?.description}</Text>
      {services.length === 0 ? (
        <View style={styles.noServicesContainer}>
          <Text style={styles.noServicesText}>No services available</Text>
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
  page: {},
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_SPACING,
  },
  serviceCard: {
    width: CARD_WIDTH,
    alignItems: "center",
    backgroundColor: Colors.neutral.white,
    padding: 6,
  },
  image: {
    width: 36,
    height: 36,
    marginBottom: 3,
  },
  imageText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.text.primary,
    textAlign: "center",
    lineHeight: 11,
  },
  noServicesText: {
    fontSize: 11,
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
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 2,
    backgroundColor: Colors.neutral.gray[200],
  },
  dotActive: {
    backgroundColor: Colors.text.primary,
  },
});
