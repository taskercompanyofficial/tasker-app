import Colors from "@/constants/Colors";
import { Shadows } from "@/constants/Styles";
import uberMapStyle from "@/constants/uberMapStyle";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

// Conditionally require react-native-maps only on native platforms
let MapViewComponent: any = null;
let MarkerComponent: any = null;
let PolylineComponent: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapViewComponent = Maps.default;
    MarkerComponent = Maps.Marker;
    PolylineComponent = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (err) {
    console.warn("[VendorMapView] react-native-maps not available:", err);
  }
}

interface VendorMapViewProps {
  mapRef: React.RefObject<any>;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  vendorLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
  } | null;
  lat: number;
  lng: number;
  hasValidCoords: boolean;
  customerName?: string;
  fullAddress: string;
  routeCoordinates: { latitude: number; longitude: number }[];
  isNavigating: boolean;
}

function VendorMapViewComponent({
  mapRef,
  initialRegion,
  vendorLocation,
  lat,
  lng,
  hasValidCoords,
  customerName,
  fullAddress,
  routeCoordinates,
  isNavigating,
}: VendorMapViewProps) {
  if (!MapViewComponent) {
    return (
      <View style={styles.webMapFallback}>
        <Ionicons name="map" size={64} color={Colors.themes.provider.primary} />
        <Text style={styles.webMapTitle}>Interactive Location Map</Text>
        <Text style={styles.webMapSubtitle}>{fullAddress}</Text>
      </View>
    );
  }

  return (
    <MapViewComponent
      ref={mapRef}
      style={styles.mapView}
      initialRegion={initialRegion}
      customMapStyle={uberMapStyle}
      showsUserLocation={true}
      showsCompass={false}
      showsMyLocationButton={false}
      showsBuildings={true}
      showsTraffic={true}
    >
      {/* Vendor Live Location Marker */}
      {vendorLocation && MarkerComponent ? (
        <MarkerComponent
          coordinate={{
            latitude: vendorLocation.latitude,
            longitude: vendorLocation.longitude,
          }}
          title="Your Live Location"
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
          rotation={vendorLocation.heading || 0}
        >
          <View style={styles.vendorLiveMarkerContainer}>
            <View style={styles.vendorLivePulseCircle} />
            <View
              style={[
                styles.vendorLivePin,
                {
                  transform: [
                    { rotate: `${vendorLocation.heading || 0}deg` },
                  ],
                },
              ]}
            >
              <Ionicons name="navigate" size={18} color={Colors.neutral.white} />
            </View>
          </View>
        </MarkerComponent>
      ) : null}

      {/* Customer Destination Marker */}
      {hasValidCoords && MarkerComponent ? (
        <MarkerComponent
          coordinate={{ latitude: lat, longitude: lng }}
          title={customerName || "Customer Location"}
          description={fullAddress}
        >
          <View style={styles.markerContainer}>
            <View style={styles.markerPulseCircle} />
            <View style={styles.markerPinCircle}>
              <Ionicons name="location" size={22} color={Colors.neutral.white} />
            </View>
          </View>
        </MarkerComponent>
      ) : null}

      {/* Polyline Directions Route Line */}
      {PolylineComponent && routeCoordinates.length > 1 ? (
        <PolylineComponent
          coordinates={routeCoordinates}
          strokeColor={Colors.themes.provider.primary}
          strokeWidth={6}
          lineDashPattern={isNavigating ? undefined : [8, 4]}
        />
      ) : null}
    </MapViewComponent>
  );
}

export const VendorMapView = memo(VendorMapViewComponent);
export default VendorMapView;

const styles = StyleSheet.create({
  mapView: {
    width: "100%",
    height: "100%",
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: Colors.themes.provider.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  webMapTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginTop: 8,
  },
  webMapSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 4,
  },
  vendorLiveMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  vendorLivePulseCircle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.themes.provider.primary + "30",
  },
  vendorLivePin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.themes.provider.primary,
    borderWidth: 2,
    borderColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerPulseCircle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.themes.provider.primary + "35",
  },
  markerPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.themes.provider.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
});
