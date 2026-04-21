import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import Colors from "@/constants/Colors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.content}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={12} style={styles.mt8} />
        </View>
      </View>
      <Skeleton width="100%" height={60} style={styles.mt16} />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.neutral.gray[200],
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  mt8: {
    marginTop: 8,
  },
  mt16: {
    marginTop: 16,
  },
});
