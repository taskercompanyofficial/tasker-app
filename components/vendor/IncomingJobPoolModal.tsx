import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  SlideInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { getGoogleMapsBindings, DEFAULT_PAKISTAN_REGION } from "@/lib/googleMaps";
import { useRouteDirections } from "@/hooks/useRouteDirections";
import { haversineMeters } from "@/lib/geo";
import type MapViewType from "react-native-maps";

const RINGTONE_SOURCE = require("@/assets/sounds/ringtone.wav");

export interface JobPoolOpportunity {
  work_order_id: number;
  work_order_number?: string;
  service_name?: string;
  area?: string;
  distance_km?: number | string;
  payout?: number | string;
  latitude?: number | null;
  longitude?: number | null;
  customer_name?: string | null;
  address?: string | null;
}

interface IncomingJobPoolModalProps {
  visible: boolean;
  opportunity: JobPoolOpportunity | null;
  onClaim: (workOrderId: number) => Promise<void>;
  onDismiss: () => void;
}

const TOTAL_COUNTDOWN_SECONDS = 45;

export default function IncomingJobPoolModal({
  visible,
  opportunity,
  onClaim,
  onDismiss,
}: IncomingJobPoolModalProps) {
  const insets = useSafeAreaInsets();
  const [secondsRemaining, setSecondsRemaining] = useState(TOTAL_COUNTDOWN_SECONDS);
  const [claiming, setClaiming] = useState(false);
  const activePlayerRef = useRef<AudioPlayer | null>(null);
  const isRingingRef = useRef<boolean>(false);
  const activeWorkOrderIdRef = useRef<number | null>(null);
  const mapRef = useRef<MapViewType | null>(null);

  const [techLocation, setTechLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Pulse animation values for radar ping
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  // Stop vibration & audio ringer helper
  const stopRinger = useCallback(() => {
    isRingingRef.current = false;
    activeWorkOrderIdRef.current = null;
    try {
      Vibration.cancel();
    } catch (_) {}
    if (activePlayerRef.current) {
      try {
        activePlayerRef.current.pause();
        activePlayerRef.current.remove();
      } catch (_) {}
      activePlayerRef.current = null;
    }
  }, []);

  // Fetch technician location on show
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    (async () => {
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && isMounted) {
          setTechLocation({
            latitude: last.coords.latitude,
            longitude: last.coords.longitude,
          });
        }
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (current && isMounted) {
          setTechLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }
      } catch (e) {
        console.warn("[IncomingJobPoolModal] Location fetch failed:", e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Clean tear-down on unmount
  useEffect(() => {
    return () => {
      stopRinger();
    };
  }, [stopRinger]);

  // Continuous vibration pattern, audible ringtone & radar pulse when modal is visible
  useEffect(() => {
    if (!visible || !opportunity) {
      stopRinger();
      return;
    }

    // Prevent duplicate audio players / vibration loops for the same opportunity
    if (
      isRingingRef.current &&
      activeWorkOrderIdRef.current === opportunity.work_order_id
    ) {
      return;
    }

    // Stop any previous sound before starting single instance
    stopRinger();

    isRingingRef.current = true;
    activeWorkOrderIdRef.current = opportunity.work_order_id;
    setSecondsRemaining(TOTAL_COUNTDOWN_SECONDS);
    setClaiming(false);

    // Continuous ringer vibration pattern: [delay, vibrate, pause, vibrate...]
    try {
      if (Platform.OS === "android") {
        Vibration.vibrate([0, 500, 250, 500, 250, 500], true);
      } else {
        Vibration.vibrate();
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (_) {}

    // Start single audible ringtone loop synchronously
    try {
      if (Platform.OS !== "web") {
        setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: "duckOthers",
        }).catch(() => {});
      }
      const player = createAudioPlayer(RINGTONE_SOURCE);
      player.loop = true;
      activePlayerRef.current = player;
      player.play();
    } catch (err) {
      console.warn("[IncomingJobPoolModal] Audio error:", err);
    }

    // Radar pulse animation
    pulseScale.value = 1;
    pulseOpacity.value = 0.7;
    pulseScale.value = withRepeat(
      withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // Countdown interval
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          stopRinger();
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopRinger();
    };
  }, [visible, opportunity?.work_order_id, stopRinger, onDismiss, pulseScale, pulseOpacity]);

  // Google Maps Bindings
  const { MapView, Marker, Polyline, PROVIDER_GOOGLE, isAvailable } =
    getGoogleMapsBindings();

  const [mapReady, setMapReady] = useState(false);

  // Determine Destination Coordinates (fallback to default Lahore coordinates if missing)
  const destLat =
    opportunity?.latitude && Number.isFinite(Number(opportunity.latitude))
      ? Number(opportunity.latitude)
      : DEFAULT_PAKISTAN_REGION.latitude;

  const destLng =
    opportunity?.longitude && Number.isFinite(Number(opportunity.longitude))
      ? Number(opportunity.longitude)
      : DEFAULT_PAKISTAN_REGION.longitude;

  const destCoords = useMemo(
    () => ({ latitude: destLat, longitude: destLng }),
    [destLat, destLng]
  );

  const origin = useMemo(
    () =>
      techLocation
        ? { latitude: techLocation.latitude, longitude: techLocation.longitude }
        : null,
    [techLocation?.latitude, techLocation?.longitude]
  );

  // Real Driving Route & Directions via Google Routes API
  const {
    routeCoordinates,
    distanceKm: routeDistanceKm,
    etaMins: routeEtaMins,
    loading: routeLoading,
  } = useRouteDirections({
    origin,
    destination: destCoords,
    enabled: visible && Boolean(origin && destLat && destLng),
    routingPreference: "TRAFFIC_UNAWARE",
    includeSteps: false,
  });

  // Calculate Distance & ETA (prefer Google Route API, fallback to backend or live GPS Haversine)
  const calculatedDistanceKm = useMemo(() => {
    if (routeDistanceKm != null && routeDistanceKm > 0) {
      return routeDistanceKm;
    }
    if (opportunity?.distance_km != null && Number(opportunity.distance_km) > 0) {
      return Number(opportunity.distance_km);
    }
    if (techLocation && destLat && destLng) {
      const m = haversineMeters(techLocation, destCoords);
      return Math.round((m / 1000) * 10) / 10;
    }
    return null;
  }, [routeDistanceKm, opportunity?.distance_km, techLocation, destCoords, destLat, destLng]);

  const calculatedEtaMins = useMemo(() => {
    if (routeEtaMins != null && routeEtaMins > 0) {
      return routeEtaMins;
    }
    if (calculatedDistanceKm != null) {
      return Math.max(3, Math.round(calculatedDistanceKm * 3));
    }
    return null;
  }, [routeEtaMins, calculatedDistanceKm]);

  // Dynamic Camera Framing: fits both technician, destination & driving route
  useEffect(() => {
    if (!visible || !mapRef.current || !mapReady) return;
    const coordsToFit =
      routeCoordinates.length > 1
        ? routeCoordinates
        : techLocation
          ? [techLocation, destCoords]
          : [destCoords];

    const timer = setTimeout(() => {
      try {
        mapRef.current?.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: insets.top + 130,
            right: 60,
            bottom: insets.bottom + 340,
            left: 60,
          },
          animated: true,
        });
      } catch (_) {}
    }, 200);

    return () => clearTimeout(timer);
  }, [visible, mapReady, routeCoordinates, techLocation, destCoords, insets]);

  const radarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handleClaimPress = async () => {
    if (!opportunity || claiming) return;
    try {
      setClaiming(true);
      stopRinger();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onClaim(opportunity.work_order_id);
    } catch (_) {
      setClaiming(false);
    }
  };

  const handleDismissPress = () => {
    stopRinger();
    onDismiss();
  };

  if (!visible || !opportunity) return null;

  const rawPayout = opportunity.payout;
  const numPayout = Number(rawPayout);
  const payoutText =
    Number.isFinite(numPayout) && numPayout > 0
      ? `₨ ${numPayout.toLocaleString()}`
      : "Standard Rate";

  const progressPercent = (secondsRemaining / TOTAL_COUNTDOWN_SECONDS) * 100;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      transparent={false}
      onRequestClose={handleDismissPress}
    >
      <View style={styles.screen}>
        {/* Full-Screen Google Maps Live Background with Directions */}
        {isAvailable && MapView ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: techLocation?.latitude || destLat,
              longitude: techLocation?.longitude || destLng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onMapReady={() => setMapReady(true)}
            showsUserLocation={false}
            showsCompass={false}
            showsScale={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            zoomControlEnabled={false}
          >
            {/* Driving Route Polyline from Google Routes API */}
            {routeCoordinates.length > 1 && Polyline ? (
              <>
                {/* Route Glow Shadow */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="rgba(37, 99, 235, 0.35)"
                  strokeWidth={8}
                />
                {/* Vibrant Driving Route Line */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#2563EB"
                  strokeWidth={4.5}
                />
              </>
            ) : techLocation && Polyline ? (
              <Polyline
                coordinates={[techLocation, destCoords]}
                strokeColor="#2563EB"
                strokeWidth={3}
                lineDashPattern={[8, 6]}
              />
            ) : null}

            {/* Technician Live Marker (Green Radar Beacon) */}
            {techLocation && Marker ? (
              <Marker
                coordinate={techLocation}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.techMarkerOuter}>
                  <Animated.View style={[styles.techMarkerRadar, radarAnimatedStyle]} />
                  <View style={styles.techMarkerCore}>
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.techMarkerLabel}>
                    <Text style={styles.techMarkerLabelText}>You (Online)</Text>
                  </View>
                </View>
              </Marker>
            ) : null}

            {/* Customer Destination Marker (Purple Teardrop Pin) */}
            {Marker ? (
              <Marker
                coordinate={destCoords}
                anchor={{ x: 0.5, y: 1.0 }}
                tracksViewChanges={false}
              >
                <View style={styles.destMarkerRoot}>
                  <View style={styles.destMarkerCallout}>
                    <Text style={styles.destMarkerCalloutText}>
                      {opportunity.area || "Customer Location"}
                    </Text>
                  </View>
                  <View style={styles.destMarkerBadge}>
                    <Ionicons name="construct" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.destMarkerStem} />
                  <View style={styles.destMarkerDot} />
                </View>
              </Marker>
            ) : null}
          </MapView>
        ) : (
          /* High-Tech Radar Sonar Fallback (Web / Simulator) */
          <View style={styles.fallbackRadar}>
            <Animated.View style={[styles.fallbackPulseCircle, radarAnimatedStyle]} />
            <View style={styles.fallbackCenterBadge}>
              <Ionicons name="radio" size={44} color="#7C3AED" />
              <Text style={styles.fallbackRadarText}>Finding route to customer...</Text>
            </View>
          </View>
        )}

        {/* Floating Route Distance & ETA Pill Overlay on Map */}
        {calculatedDistanceKm != null ? (
          <View
            style={[
              styles.floatingDistanceBadge,
              { bottom: insets.bottom + 275 },
            ]}
          >
            <Ionicons name="car" size={14} color="#3B82F6" />
            <Text style={styles.floatingDistanceBadgeText}>
              {calculatedDistanceKm} km away {calculatedEtaMins ? `• ~${calculatedEtaMins} min drive` : ""}
            </Text>
          </View>
        ) : null}

        {/* Top Floating Urgent Header Overlay */}
        <View style={[styles.topHeaderCard, { top: insets.top + 10 }]}>
          <View style={styles.topHeaderRow}>
            {/* Live Indicator & Title */}
            <View style={styles.topHeaderLeft}>
              <View style={styles.badgeRow}>
                <View style={styles.pulsingRedDot} />
                <Text style={styles.badgeLabel}>⚡ NEW JOB AVAILABLE</Text>
              </View>
              <Text style={styles.subBadgeText}>
                Nearby In Your Service Area • Instant Claim
              </Text>
            </View>

            {/* Circular Countdown Badge */}
            <View style={styles.timerCircle}>
              <Text style={styles.timerCountText}>{secondsRemaining}s</Text>
              <Text style={styles.timerUnitText}>LEFT</Text>
            </View>

            {/* Close / Dismiss "X" Button */}
            <TouchableOpacity
              style={styles.closeRoundButton}
              onPress={handleDismissPress}
              disabled={claiming}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Progress bar line */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Bottom Floating Offer Card (Careem / Uber / inDrive Style) */}
        <Animated.View
          entering={SlideInDown.duration(320)}
          style={[styles.bottomCard, { bottom: insets.bottom + 12 }]}
        >
          {/* Top Row: Service Title & Payout */}
          <View style={styles.bottomHeaderRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.serviceTitle} numberOfLines={2}>
                {opportunity.service_name || "New Service Booking"}
              </Text>
              {opportunity.work_order_number ? (
                <Text style={styles.orderNumberText}>
                  Order #{opportunity.work_order_number}
                </Text>
              ) : null}
            </View>

            {/* Payout Tag */}
            <View style={styles.payoutBadge}>
              <Text style={styles.payoutLabel}>GUARANTEED PAY</Text>
              <Text style={styles.payoutValue}>{payoutText}</Text>
            </View>
          </View>

          {/* Middle Details Row (Location, Distance, Customer) */}
          <View style={styles.detailsRow}>
            {/* Location Pill */}
            <View style={styles.detailPill}>
              <Ionicons name="location" size={14} color="#A78BFA" />
              <Text style={styles.detailPillText} numberOfLines={1}>
                {opportunity.area || "Lahore Area"}
              </Text>
            </View>

            {/* Distance & ETA (Real-time Driving Distance) */}
            {calculatedDistanceKm != null ? (
              <View style={styles.detailPill}>
                <Ionicons name="navigate" size={14} color="#10B981" />
                <Text style={styles.detailPillText}>
                  {calculatedDistanceKm} km {calculatedEtaMins ? `• ~${calculatedEtaMins}m away` : ""}
                </Text>
              </View>
            ) : routeLoading ? (
              <View style={styles.detailPill}>
                <ActivityIndicator size="small" color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.detailPillText}>Calculating route...</Text>
              </View>
            ) : null}

            {/* Customer Pill */}
            <View style={styles.detailPill}>
              <Ionicons name="person" size={13} color="#60A5FA" />
              <Text style={styles.detailPillText} numberOfLines={1}>
                {opportunity.customer_name || "Customer"} • ⭐ 4.9
              </Text>
            </View>
          </View>

          {/* Full Address Preview if Available */}
          {opportunity.address ? (
            <View style={styles.addressBox}>
              <Ionicons name="map-outline" size={13} color="#94A3B8" />
              <Text style={styles.addressText} numberOfLines={1}>
                {opportunity.address}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionsBox}>
            <TouchableOpacity
              style={[styles.claimButton, claiming && styles.buttonDisabled]}
              onPress={handleClaimPress}
              disabled={claiming}
              activeOpacity={0.88}
            >
              {claiming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="flash" size={22} color="#FFFFFF" />
                  <Text style={styles.claimButtonText}>⚡ Claim Job Now</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.passButton}
              onPress={handleDismissPress}
              disabled={claiming}
              activeOpacity={0.7}
            >
              <Text style={styles.passButtonText}>✕ Decline / Pass</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  fallbackRadar: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1120",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackPulseCircle: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(124, 58, 237, 0.25)",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  fallbackCenterBadge: {
    alignItems: "center",
    gap: 8,
  },
  fallbackRadarText: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Technician Live Marker */
  techMarkerOuter: {
    alignItems: "center",
    justifyContent: "center",
    width: 90,
    height: 90,
  },
  techMarkerRadar: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.35)",
  },
  techMarkerCore: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#059669",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  techMarkerLabel: {
    marginTop: 4,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  techMarkerLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  /* Customer Destination Marker */
  destMarkerRoot: {
    alignItems: "center",
  },
  destMarkerCallout: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7C3AED",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  destMarkerCalloutText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "700",
  },
  destMarkerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  destMarkerStem: {
    width: 3,
    height: 8,
    backgroundColor: "#7C3AED",
  },
  destMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
  },

  /* Top Floating Urgent Header Overlay */
  topHeaderCard: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.65)",
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  topHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  pulsingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  badgeLabel: {
    color: "#F1F5F9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  subBadgeText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
  },
  timerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1E293B",
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  timerCountText: {
    color: "#F59E0B",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 18,
  },
  timerUnitText: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "800",
  },
  closeRoundButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBarTrack: {
    width: "100%",
    height: 3.5,
    backgroundColor: "#334155",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 2,
  },

  /* Bottom Floating Offer Card */
  bottomCard: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: "#1E293B",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#334155",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  bottomHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  serviceTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 25,
  },
  orderNumberText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  payoutBadge: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    alignItems: "flex-end",
  },
  payoutLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  payoutValue: {
    color: "#10B981",
    fontSize: 20,
    fontWeight: "900",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  detailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0F172A",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  detailPillText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  addressText: {
    color: "#94A3B8",
    fontSize: 12,
    flex: 1,
  },
  actionsBox: {
    gap: 8,
  },
  claimButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#059669",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  claimButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  passButton: {
    width: "100%",
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  passButtonText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  floatingDistanceBadge: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  floatingDistanceBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
