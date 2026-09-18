import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  label?: string;
}

export function LocationMessage({ latitude, longitude, label }: LocationMessageProps) {
  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <TouchableOpacity onPress={openInMaps} activeOpacity={0.9} style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={{ latitude, longitude }} />
        </MapView>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location" size={16} color="#4B5563" />
        <Text style={styles.locationText} numberOfLines={1}>
          {label || "Shared Location"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
  },
  mapContainer: {
    height: 120,
    width: "100%",
  },
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "500",
  },
});
