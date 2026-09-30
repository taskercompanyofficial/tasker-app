import FileGallery from "@/components/FileGallery";
import Modal from "@/components/Modal";
import ActionButtons from "@/components/work-order-details/ActionButtons";
import CustomerInfoSection from "@/components/work-order-details/CustomerInfoSection";
import ProductInfoSection from "@/components/work-order-details/ProductInfoSection";
import ReasonModal from "@/components/work-order-details/ReasonModal";
import ScheduleModal from "@/components/work-order-details/ScheduleModal";
import ServiceHeaderCard from "@/components/work-order-details/ServiceHeaderCard";
import ServiceInfoSection from "@/components/work-order-details/ServiceInfoSection";
import StaffSelectionModal from "@/components/work-order-details/StaffSelectionModal";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { WorkOrder } from "@/types/work-order";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import VendorMapView from "./VendorMapView";
import WorkOrderShareModal from "./WorkOrderShareModal";
import {
  startVendorBackgroundNavigation,
  stopVendorBackgroundNavigation,
  setupVendorAppStateNavigationNotice,
} from "@/lib/vendorBackgroundLocation";
import { activeTripStore } from "@/components/vendor/VendorActiveTripBubble";
import { setupSystemOverlayAppStateSync } from "@/lib/floatingBubble";

import { useAuthStore } from "@/context/auth-store";
import { VENDOR_LOCATION_PING_URL, VENDOR_STAFF_LOCATION_PING_URL } from "@/lib/api-endpoints";
import axios from "axios";

/**
 * Foreground location ping — called on every watchPositionAsync update while
 * the vendor has the app open. Sends lat/lng to Laravel which broadcasts
 * VendorLocationUpdated to the customer's Reverb channel.
 */
async function sendForegroundLocationPing(
  latitude: number,
  longitude: number,
  heading: number | null | undefined,
  speed: number | null | undefined,
  workOrderId: number | string,
): Promise<void> {
  try {
    const state = useAuthStore.getState();
    const token = state.token;
    const mode = state.appMode;
    if (!token) {
      console.warn("[FG-PING:SKIPPED] No auth token available in useAuthStore");
      return;
    }

    const url = mode === "vendor_staff"
      ? VENDOR_STAFF_LOCATION_PING_URL
      : VENDOR_LOCATION_PING_URL;

    console.log(
      `🚀 [FG-PING:POSTING] -> ${url} | Order #${workOrderId} | Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`
    );

    const res = await axios.post(
      url,
      {
        latitude,
        longitude,
        heading: heading ?? null,
        speed: speed ?? null,
        battery_level: 100,
        is_charging: false,
        work_order_id: workOrderId,
        app_state: "foreground",
      },
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        timeout: 5000,
      },
    );

    console.log(
      `✅ [FG-PING:SUCCESS] Foreground location accepted by backend! Status: ${res.status}`
    );
  } catch (err: any) {
    console.error(
      "❌ [FG-PING:FAILED] Foreground location ping failed:",
      err?.response?.status ?? err?.code ?? "Network Error",
      err?.response?.data ?? err?.message
    );
  }
}






function calculateDistanceAndEta(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;

  // Average city driving speed ~25 km/h
  const mins = Math.max(1, Math.round((dist / 25) * 60));
  return { distanceKm: parseFloat(dist.toFixed(1)), etaMins: mins };
}

// Decode Google Maps Encoded Polyline String
function decodeGooglePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

interface UberVendorWorkOrderViewProps {
  workOrder: WorkOrder;
  id: string;
  refreshing: boolean;
  onRefresh: () => void;
  approvedStaff: any[];
  accepting: boolean;
  rejecting: boolean;
  updatingStatus: boolean;
  isPendingAcceptance: boolean;
  isAccepted: boolean;
  currentStatusSlug: string;
  currentSubStatusSlug?: string;
  pendingStatusUpdate: any;
  modalMessage: string;
  showSuccessModal: boolean;
  showErrorModal: boolean;
  handleAccept: () => Promise<void>;
  handleReject: (reason: string) => Promise<void>;
  handleCancel: (reason: string) => Promise<void>;
  handleSchedule: (date: string, time: string, remarks: string) => Promise<void>;
  handleAssignStaff: (staffId: number) => Promise<void>;
  handleUpdateStatus: (remarks: string) => Promise<void>;
  showStatusUpdateModal: (
    statusSlug: string,
    subStatusSlug: string,
    statusName: string,
  ) => void;
  clearStatusUpdate: () => void;
  setShowSuccessModal: (val: boolean) => void;
  setShowErrorModal: (val: boolean) => void;
  onSwitchToClassicView?: () => void;
}

export default function UberVendorWorkOrderView({
  workOrder,
  id,
  refreshing,
  onRefresh,
  approvedStaff,
  accepting,
  rejecting,
  updatingStatus,
  isPendingAcceptance,
  isAccepted,
  currentStatusSlug,
  currentSubStatusSlug,
  pendingStatusUpdate,
  modalMessage,
  showSuccessModal,
  showErrorModal,
  handleAccept,
  handleReject,
  handleCancel,
  handleSchedule,
  handleAssignStaff,
  handleUpdateStatus,
  showStatusUpdateModal,
  clearStatusUpdate,
  setShowSuccessModal,
  setShowErrorModal,
  onSwitchToClassicView,
}: UberVendorWorkOrderViewProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<any>(null);

  // Live Location & Directions state
  const [vendorLocation, setVendorLocation] = useState<{
    latitude: number;
    longitude: number;
    heading?: number;
  } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [initialDistanceKm, setInitialDistanceKm] = useState<number | null>(null);
  const [etaMins, setEtaMins] = useState<number | null>(null);

  // Calculate percentage of route completed (fills from 0% to 100% as driver approaches)
  const routeProgressPercent = useMemo(() => {
    if (!initialDistanceKm || distanceKm === null || initialDistanceKm <= 0) return 0;
    const covered = initialDistanceKm - distanceKm;
    const rawPct = (covered / initialDistanceKm) * 100;
    return Math.min(100, Math.max(0, Math.round(rawPct)));
  }, [initialDistanceKm, distanceKm]);

  // Modal visibility states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Parse coordinates
  const addressObj = workOrder.address as any;
  const rawLat = addressObj?.latitude ?? addressObj?.lat;
  const rawLng = addressObj?.longitude ?? addressObj?.lng;

  const lat = typeof rawLat === "number" ? rawLat : parseFloat(String(rawLat || ""));
  const lng = typeof rawLng === "number" ? rawLng : parseFloat(String(rawLng || ""));

  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  // Navigation camera mode state
  const [isNavigating, setIsNavigating] = useState(true);
  // Real street-by-street route coordinates (OSRM)
  const [streetRoutePoints, setStreetRoutePoints] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Live location & Vendor Background Location tracking effect
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let removeAppStateNotice: (() => void) | null = null;
    let removeSystemOverlaySync: (() => void) | null = null;

    async function initLiveLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        // Start background location service for vendors
        if (workOrder?.work_order_number) {
          await startVendorBackgroundNavigation(
            workOrder.id,                   // ← DB id for location ping payload
            workOrder.work_order_number,    // ← for notification text
            workOrder.customer?.name,
          );
          removeAppStateNotice = setupVendorAppStateNavigationNotice(
            workOrder.work_order_number,
          );
          removeSystemOverlaySync = setupSystemOverlayAppStateSync(
            workOrder.work_order_number,
          );

          // Show global floating bubble on other vendor screens
          activeTripStore.setTrip({
            workOrderId: workOrder.id,
            workOrderNumber: workOrder.work_order_number,
            customerName: workOrder.customer?.name,
          });
        }


        const currentLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        if (currentLoc) {
          const coords = {
            latitude: currentLoc.coords.latitude,
            longitude: currentLoc.coords.longitude,
            heading: currentLoc.coords.heading || 0,
            speed: currentLoc.coords.speed || 0,
          };
          setVendorLocation(coords);

          console.log(
            `📍 [FG-GPS:INITIAL_FIX] Lat: ${coords.latitude.toFixed(5)}, Lng: ${coords.longitude.toFixed(5)}`
          );

          // Initial ping on screen mount
          if (workOrder?.id) {
            sendForegroundLocationPing(
              coords.latitude,
              coords.longitude,
              coords.heading,
              coords.speed,
              workOrder.id,
            ).catch(() => {});
          }

          if (hasValidCoords) {
            const info = calculateDistanceAndEta(
              coords.latitude,
              coords.longitude,
              lat,
              lng,
            );
            setDistanceKm(info.distanceKm);
            setEtaMins(info.etaMins);
            setInitialDistanceKm((prev) =>
              prev === null || info.distanceKm > prev ? info.distanceKm : prev,
            );
          }
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 3000,
            distanceInterval: 0,
          },
          (loc) => {
            const coords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading || 0,
              speed: loc.coords.speed || 0,
            };
            setVendorLocation(coords);
            console.log(
              `📍 [FG-GPS:WATCH_UPDATE] Lat: ${coords.latitude.toFixed(5)}, Lng: ${coords.longitude.toFixed(5)}`
            );

            // Foreground ping — sends location to Laravel while app is open
            // (background task handles it when app is minimized)
            if (workOrder?.id) {
              sendForegroundLocationPing(
                coords.latitude,
                coords.longitude,
                coords.heading,
                coords.speed,
                workOrder.id,
              ).catch(() => {});
            }

            if (hasValidCoords) {
              const info = calculateDistanceAndEta(
                coords.latitude,
                coords.longitude,
                lat,
                lng,
              );
              setDistanceKm(info.distanceKm);
              setEtaMins(info.etaMins);
              setInitialDistanceKm((prev) =>
                prev === null || info.distanceKm > prev ? info.distanceKm : prev,
              );

              // If follow camera mode is enabled, animate map camera to follow user position
              if (isNavigating && mapRef.current) {
                mapRef.current.animateCamera(
                  {
                    center: {
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    },
                    heading: coords.heading || 0,
                    pitch: 45,
                    zoom: 17,
                  },
                  { duration: 1000 },
                );
              }
            }
          },
        );
      } catch (e) {
        console.warn("[UberVendorView] Location tracking error:", e);
      }
    }

    initLiveLocation();

    return () => {
      // Pause screen-specific map watching when navigating away from this screen
      subscription?.remove();
      // NOTE: Background tracking (startVendorBackgroundNavigation), activeTripStore,
      // and system overlay (FloatingBubble) deliberately REMAIN ACTIVE so the vendor
      // can navigate to Dashboard, Chat, or Google Maps while tracking stays alive!
    };
  }, [hasValidCoords, isNavigating, lat, lng, workOrder?.customer?.name, workOrder?.work_order_number, workOrder?.id]);



  // Fetch actual street-by-street driving route from Google Directions API (or OSRM fallback)
  useEffect(() => {
    if (!vendorLocation || !hasValidCoords) return;

    const vLat = vendorLocation.latitude;
    const vLng = vendorLocation.longitude;
    let isMounted = true;

    async function fetchStreetRoute() {
      try {
        const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (googleApiKey && googleApiKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
          // Official Google Maps Directions API
          const googleUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${vLat},${vLng}&destination=${lat},${lng}&key=${googleApiKey}`;
          const res = await fetch(googleUrl);
          const data = await res.json();

          if (isMounted && data.status === "OK" && data.routes?.[0]) {
            const route = data.routes[0];
            const polylinePoints = route.overview_polyline?.points;
            if (polylinePoints) {
              const decodedCoords = decodeGooglePolyline(polylinePoints);
              setStreetRoutePoints(decodedCoords);
            }

            const leg = route.legs?.[0];
            if (leg?.distance?.value && leg?.duration?.value) {
              const distKm = parseFloat((leg.distance.value / 1000).toFixed(1));
              const mins = Math.max(1, Math.round(leg.duration.value / 60));
              setDistanceKm(distKm);
              setEtaMins(mins);
              setInitialDistanceKm((prev) =>
                prev === null || distKm > prev ? distKm : prev,
              );
              return;
            }
          }
        }

        // Fallback: OSRM Driving Route Service
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${vLng},${vLat};${lng},${lat}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (isMounted && data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map(
            (pt: [number, number]) => ({
              latitude: pt[1],
              longitude: pt[0],
            }),
          );
          setStreetRoutePoints(coords);

          if (data.routes[0].distance && data.routes[0].duration) {
            const distKm = parseFloat((data.routes[0].distance / 1000).toFixed(1));
            const mins = Math.max(1, Math.round(data.routes[0].duration / 60));
            setDistanceKm(distKm);
            setEtaMins(mins);
            setInitialDistanceKm((prev) =>
              prev === null || distKm > prev ? distKm : prev,
            );
          }
        }
      } catch (err) {
        console.warn("[UberVendorView] Driving route fetch fallback:", err);
      }
    }

    fetchStreetRoute();

    return () => {
      isMounted = false;
    };
  }, [vendorLocation?.latitude, vendorLocation?.longitude, hasValidCoords, lat, lng]);

  // Default region fallback if coords missing
  const initialRegion = {
    latitude: hasValidCoords ? lat : 31.5204,
    longitude: hasValidCoords ? lng : 74.3587,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  const fullAddress = `${workOrder.address?.address_line_1 || ""}, ${workOrder.address?.city || ""
    }, ${workOrder.address?.state || ""}`.replace(/^,\s*/, "");

  const snapPoints = useMemo(() => ["46%", "78%", "94%"], []);

  const routeCoordinates =
    streetRoutePoints.length > 0
      ? streetRoutePoints
      : vendorLocation && hasValidCoords
        ? [
          {
            latitude: vendorLocation.latitude,
            longitude: vendorLocation.longitude,
          },
          { latitude: lat, longitude: lng },
        ]
        : [];

  const handleRecenterMap = () => {
    setIsNavigating(false);
    if (mapRef.current && hasValidCoords) {
      mapRef.current.animateToRegion(initialRegion, 800);
    }
  };

  const handleFitRouteBounds = () => {
    setIsNavigating(false);
    if (mapRef.current && vendorLocation && hasValidCoords) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: vendorLocation.latitude,
            longitude: vendorLocation.longitude,
          },
          { latitude: lat, longitude: lng },
        ],
        {
          edgePadding: { top: 180, right: 60, bottom: 280, left: 60 },
          animated: true,
        },
      );
    } else {
      handleRecenterMap();
    }
  };

  const handleToggleNavigationMode = () => {
    const nextNavState = !isNavigating;
    setIsNavigating(nextNavState);
    if (nextNavState && vendorLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: vendorLocation.latitude,
            longitude: vendorLocation.longitude,
          },
          heading: vendorLocation.heading || 0,
          pitch: 45,
          zoom: 17,
        },
        { duration: 800 },
      );
    } else {
      handleFitRouteBounds();
    }
  };

  const handleCallCustomer = () => {
    if (workOrder.customer?.phone) {
      Linking.openURL(`tel:${workOrder.customer.phone}`);
    }
  };

  const handleChatCustomer = () => {
    router.push(`/vendor/work-order-chat/${workOrder.id}` as any);
  };

  const handleWhatsAppCustomer = () => {
    if (workOrder.customer?.whatsapp) {
      const cleanNumber = workOrder.customer.whatsapp.replace(/\D/g, "");
      Linking.openURL(`https://wa.me/${cleanNumber}`);
    }
  };

  const handleNavigateGoogleMaps = () => {
    let url = "";
    if (hasValidCoords) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullAddress,
      )}`;
    }
    Linking.openURL(url).catch(() => {
      Toast.show({ type: "error", text1: "Could not open Google Maps" });
    });
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
        opacity={0.3}
      />
    ),
    [],
  );

  const onAssignStaff = async (staffId: number) => {
    setShowStaffModal(false);
    await handleAssignStaff(staffId);
  };

  const onAccept = async () => {
    setShowAcceptModal(false);
    await handleAccept();
  };

  const onReject = async (reason: string) => {
    setShowRejectModal(false);
    await handleReject(reason);
    await stopVendorBackgroundNavigation();
    activeTripStore.setTrip(null);
  };

  const onCancelOrder = async (reason: string) => {
    setShowCancelModal(false);
    await handleCancel(reason);
    await stopVendorBackgroundNavigation();
    activeTripStore.setTrip(null);
  };

  const onScheduleOrder = async (
    date: string,
    time: string,
    remarks: string,
  ) => {
    setShowScheduleModal(false);
    await handleSchedule(date, time, remarks);
  };

  const onStatusUpdate = async (remarks: string) => {
    setShowStatusModal(false);
    const targetStatus = pendingStatusUpdate?.statusSlug || pendingStatusUpdate?.status_slug;
    await handleUpdateStatus(remarks);
    if (
      targetStatus === "completed" ||
      targetStatus === "cancelled" ||
      targetStatus === "closed"
    ) {
      await stopVendorBackgroundNavigation();
      activeTripStore.setTrip(null);
    }
  };

  const handleStatusButtonPress = (
    statusSlug: string,
    subStatusSlug: string,
    statusName: string,
  ) => {
    showStatusUpdateModal(statusSlug, subStatusSlug, statusName);
    setShowStatusModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Uber / inDrive Fullscreen Background Map */}
      <View style={styles.mapWrapper}>
        <VendorMapView
          mapRef={mapRef}
          initialRegion={initialRegion}
          vendorLocation={vendorLocation}
          lat={lat}
          lng={lng}
          hasValidCoords={hasValidCoords}
          customerName={workOrder.customer?.name}
          fullAddress={fullAddress}
          routeCoordinates={routeCoordinates}
          isNavigating={isNavigating}
        />

        {/* Top Header Controls & Navigation Guidance Banner Stack */}
        <View style={styles.topOverlayContainer}>
          {/* Row 1: Back Button | Work Order Number & Status Badge | Share Button */}
          <View style={styles.topFloatingBarRow}>
            <TouchableOpacity
              style={styles.floatingRoundBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerInfoPill}>
              <Text style={styles.headerWorkOrderNumber}>
                #{workOrder.work_order_number}
              </Text>
              <View style={styles.headerStatusDot} />
              <Text style={styles.headerStatusName}>{workOrder.status?.name}</Text>
            </View>

            <TouchableOpacity
              style={styles.floatingRoundBtn}
              onPress={() => setShowShareModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={Colors.themes.provider.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Row 2: In-App Turn-by-Turn Directions Banner */}
          {distanceKm !== null && etaMins !== null && (
            <View style={styles.turnDirectionsHeaderBanner}>
              <View style={styles.turnManeuverCircle}>
                <Ionicons
                  name={isNavigating ? "navigate-circle" : "compass-outline"}
                  size={24}
                  color={Colors.neutral.white}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.turnAddressTitle} numberOfLines={1}>
                  {workOrder.address?.address_line_1 || fullAddress}
                </Text>
                <Text style={styles.turnManeuverSub}>
                  {isNavigating
                    ? `Live Nav • ${etaMins} mins left (${distanceKm} km) • ${routeProgressPercent}%`
                    : `Route Overview • ${distanceKm} km`}
                </Text>

                {/* Real-Time Navigation Route Progress Bar */}
                {isNavigating && (
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(5, routeProgressPercent)}%` },
                      ]}
                    />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.navModeTogglePill,
                  isNavigating
                    ? styles.navModeActivePill
                    : styles.navModeInactivePill,
                ]}
                onPress={handleToggleNavigationMode}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isNavigating ? "pause" : "play"}
                  size={12}
                  color={
                    isNavigating
                      ? Colors.neutral.white
                      : Colors.themes.provider.primary
                  }
                />
                <Text
                  style={[
                    styles.navModeToggleText,
                    {
                      color: isNavigating
                        ? Colors.neutral.white
                        : Colors.themes.provider.primary,
                    },
                  ]}
                >
                  {isNavigating ? "NAV" : "START"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recenter & Camera Mode Map Floating Controls */}
        {hasValidCoords && (
          <View style={styles.mapControlStack}>
            <TouchableOpacity
              style={[
                styles.recenterFab,
                isNavigating && { backgroundColor: Colors.themes.provider.primary },
              ]}
              onPress={handleToggleNavigationMode}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isNavigating ? "compass" : "navigate-outline"}
                size={20}
                color={isNavigating ? Colors.neutral.white : Colors.themes.provider.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recenterFab}
              onPress={handleFitRouteBounds}
              activeOpacity={0.85}
            >
              <Ionicons
                name="scan-outline"
                size={20}
                color={Colors.themes.provider.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modern Draggable Bottom Sheet for Complaint & Order Details */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          {/* Quick Overview Card (Visible in Collapsed State) */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryServiceName}>
                  {workOrder.service?.name || "Service Order"}
                </Text>
                <Text style={styles.summaryCustomerName}>
                  {workOrder.customer?.name} • {workOrder.address?.city}
                </Text>
              </View>

              <View
                style={[
                  styles.priorityBadge,
                  workOrder.priority === "urgent" || workOrder.priority === "high"
                    ? styles.priorityUrgent
                    : styles.priorityNormal,
                ]}
              >
                <Text style={styles.priorityBadgeText}>
                  {workOrder.priority?.toUpperCase() || "NORMAL"}
                </Text>
              </View>
            </View>

            {/* Quick Action Button Bar */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickCallBtn}
                onPress={handleCallCustomer}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={15} color={Colors.neutral.white} />
                <Text style={styles.quickCallBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickChatBtn}
                onPress={handleChatCustomer}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles" size={15} color={Colors.neutral.white} />
                <Text style={styles.quickChatBtnText}>Chat</Text>
              </TouchableOpacity>

              {workOrder.customer?.whatsapp ? (
                <TouchableOpacity
                  style={styles.quickWhatsappBtn}
                  onPress={handleWhatsAppCustomer}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={15} color={Colors.neutral.white} />
                  <Text style={styles.quickWhatsappBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.quickNavBtn}
                onPress={handleNavigateGoogleMaps}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={15} color={Colors.neutral.white} />
                <Text style={styles.quickNavBtnText}>Nav</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Expanded Detailed Sections */}
          <ServiceHeaderCard
            serviceName={workOrder.service?.name || "Service"}
            parentServiceName={workOrder.parent_service?.name}
            workOrderNumber={workOrder.work_order_number}
            createdAt={workOrder.created_at}
            assignedAt={workOrder.assigned_at}
            productImage={workOrder.product?.image}
            brandName={workOrder.brand?.name}
            priority={workOrder.priority}
            categoryName={workOrder.category?.name}
            brandComplaintNo={workOrder.brand_complaint_no}
          />

          <CustomerInfoSection
            customer={workOrder.customer}
            address={workOrder.address}
            extraNumber={workOrder.extra_number}
            workOrderId={workOrder.id}
          />

          <ServiceInfoSection
            product={workOrder.product}
            category={workOrder.category}
            parentService={workOrder.parent_service}
            service={workOrder.service}
            serviceConcern={workOrder.service_sub_concern}
            serviceSubConcern={workOrder.service_concern}
            warrantyType={workOrder.warranty_type}
            isWarrantyCase={!!workOrder.is_warranty_case}
            warrantyStatus={workOrder.warrentyStatus}
            subStatus={workOrder.sub_status}
            customerDescription={workOrder.customer_description}
            reminders={workOrder.reminders}
            assignmentMessage={workOrder.notes}
          />

          <ProductInfoSection
            brand={workOrder.brand}
            product={workOrder.product}
            productIndoorModel={workOrder.product_indoor_model}
            indoorSerialNumber={workOrder.indoor_serial_number}
            productOutdoorModel={workOrder.product_outdoor_model}
            outdoorSerialNumber={workOrder.outdoor_serial_number}
            purchaseDate={workOrder.purchase_date}
            isWarrantyCase={!!workOrder.is_warranty_case}
            technicianRemarks={workOrder.technician_remarks}
            reference={workOrder.reference}
            extraNumber={workOrder.extra_number}
          />

          <View style={styles.sectionCard}>
            <FileGallery files={workOrder.files || []} title="Photos/Documents" />
          </View>

          {workOrder.accepted_at && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                  <Text style={styles.sectionTitle}>Field Team</Text>
                </View>
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => setShowStaffModal(true)}
                >
                  <Text style={styles.assignButtonText}>
                    {workOrder.vendor_staff ? "Change Staff" : "Assign Staff"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionContent}>
                {workOrder.vendor_staff ? (
                  <View style={styles.assignedStaffCard}>
                    <View style={styles.staffAvatarSmall}>
                      {(() => {
                        const avatarPath =
                          workOrder.vendor_staff.active_avatar_url ||
                          workOrder.vendor_staff.daily_selfie_image ||
                          workOrder.vendor_staff.image;
                        if (avatarPath) {
                          return (
                            <Image
                              source={{
                                uri: avatarPath.startsWith("http")
                                  ? avatarPath
                                  : `/${avatarPath}`,
                              }}
                              style={{ width: 36, height: 36, borderRadius: 18 }}
                            />
                          );
                        }
                        return (
                          <Text style={styles.avatarTextSmall}>
                            {workOrder.vendor_staff.name.charAt(0).toUpperCase()}
                          </Text>
                        );
                      })()}
                    </View>
                    <View style={styles.staffDetails}>
                      <Text style={styles.staffNameText}>
                        {workOrder.vendor_staff.name}
                      </Text>
                      <Text style={styles.staffPhoneText}>
                        {workOrder.vendor_staff.phone}
                      </Text>
                    </View>
                    <View style={styles.statusBadgeSmall}>
                      <Text style={styles.statusBadgeTextSmall}>Assigned</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyStaffState}>
                    <Text style={styles.emptyStaffText}>
                      No staff assigned yet.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <ActionButtons
            workOrderId={Number(id)}
            isPendingAcceptance={isPendingAcceptance}
            isAccepted={isAccepted}
            currentStatusSlug={currentStatusSlug}
            currentSubStatusSlug={currentSubStatusSlug}
            accepting={accepting}
            rejecting={rejecting}
            updatingStatus={updatingStatus}
            onAccept={() => setShowAcceptModal(true)}
            onReject={() => setShowRejectModal(true)}
            onCancel={() => setShowCancelModal(true)}
            onSchedule={() => setShowScheduleModal(true)}
            onStatusUpdate={handleStatusButtonPress}
          />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Action Modals */}
      <Modal
        visible={showAcceptModal}
        type="confirm"
        title="Accept Job"
        message="Are you sure you want to accept this job?"
        actions={[
          {
            text: "Cancel",
            onPress: () => setShowAcceptModal(false),
            variant: "outline",
          },
          { text: "Accept", onPress: onAccept, variant: "primary" },
        ]}
        onClose={() => setShowAcceptModal(false)}
      />

      <ReasonModal
        visible={showRejectModal}
        title="Reject Job"
        message="Please provide a reason for rejection:"
        placeholder="Enter rejection reason..."
        confirmText="Reject"
        loading={rejecting}
        onConfirm={onReject}
        onCancel={() => setShowRejectModal(false)}
      />

      <ReasonModal
        visible={showCancelModal}
        title="Cancel Job"
        message="Please provide a reason for cancellation:"
        placeholder="Enter cancellation reason..."
        confirmText="Cancel Job"
        loading={rejecting}
        onConfirm={onCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />

      <ScheduleModal
        visible={showScheduleModal}
        loading={updatingStatus}
        onConfirm={onScheduleOrder}
        onCancel={() => setShowScheduleModal(false)}
      />

      <ReasonModal
        visible={showStatusModal}
        title="Update Status"
        message={`Update job status to ${pendingStatusUpdate?.statusName}?`}
        placeholder="Add remarks or comments (optional)..."
        confirmText="Confirm"
        loading={updatingStatus}
        onConfirm={onStatusUpdate}
        onCancel={() => {
          setShowStatusModal(false);
          clearStatusUpdate();
        }}
      />

      <Modal
        visible={showSuccessModal}
        type="success"
        title="Success"
        message={modalMessage}
        onClose={() => setShowSuccessModal(false)}
      />
      <Modal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={modalMessage}
        onClose={() => setShowErrorModal(false)}
      />

      <StaffSelectionModal
        visible={showStaffModal}
        staff={approvedStaff}
        onSelect={onAssignStaff}
        onClose={() => setShowStaffModal(false)}
        loading={updatingStatus}
      />

      <WorkOrderShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        workOrder={workOrder}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  mapWrapper: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  mapView: {
    width: "100%",
    height: "100%",
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: Colors.themes.provider.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  webMapTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  webMapSubtitle: {
    fontSize: Typography.sizes.xs,
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
  topOverlayContainer: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.md,
    right: Spacing.md,
    gap: Spacing.xs,
    zIndex: 20,
  },
  topFloatingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  floatingRoundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  headerInfoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    ...Shadows.md,
  },
  headerWorkOrderNumber: {
    fontSize: Typography.sizes.xs,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.themes.provider.primary,
  },
  headerStatusName: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.themes.provider.primary,
    textTransform: "uppercase",
  },
  turnDirectionsHeaderBanner: {
    backgroundColor: Colors.themes.provider.primaryDark || "#0F172A",
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.md,
  },
  turnManeuverCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.themes.provider.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  turnAddressTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  turnManeuverSub: {
    fontSize: 10,
    color: Colors.neutral.gray[300],
    marginTop: 2,
  },
  progressBarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
  navModeTogglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  navModeActivePill: {
    backgroundColor: Colors.themes.provider.primary,
  },
  navModeInactivePill: {
    backgroundColor: Colors.neutral.white,
  },
  navModeToggleText: {
    fontSize: 10,
    fontWeight: "800",
  },
  mapControlStack: {
    position: "absolute",
    top: 145,
    right: Spacing.md,
    gap: Spacing.xs,
    zIndex: 15,
  },
  recenterFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  bottomSheetBackground: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  bottomSheetIndicator: {
    backgroundColor: Colors.neutral.gray[300],
    width: 40,
    height: 4,
  },
  sheetScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    gap: Spacing.sm,
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  summaryServiceName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  summaryCustomerName: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityUrgent: {
    backgroundColor: Colors.error + "15",
  },
  priorityNormal: {
    backgroundColor: Colors.info + "15",
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.error,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: 4,
  },
  quickCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 5,
  },
  quickCallBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  quickChatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 5,
  },
  quickChatBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  quickWhatsappBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  quickWhatsappBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  quickNavBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  quickNavBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  quickShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.primaryDark || "#0F172A",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  quickShareBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  sectionCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    textTransform: "uppercase",
  },
  sectionContent: { padding: Spacing.md },
  assignButton: {
    backgroundColor: Colors.themes.provider.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  assignButtonText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.provider.primary,
  },
  assignedStaffCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  staffAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.themes.provider.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  avatarTextSmall: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
  },
  staffDetails: { flex: 1 },
  staffNameText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  staffPhoneText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  statusBadgeSmall: {
    backgroundColor: Colors.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeTextSmall: {
    fontSize: 8,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
    textTransform: "uppercase",
  },
  emptyStaffState: { paddingVertical: Spacing.xs },
  emptyStaffText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    fontStyle: "italic",
  },
});
