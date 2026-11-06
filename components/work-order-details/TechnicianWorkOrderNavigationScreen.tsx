import DirectionalIcon from "@/components/common/DirectionalIcon";
import Modal from "@/components/Modal";
import { activeTripStore } from "@/components/vendor/VendorActiveTripBubble";
import { VendorMapHandle, VendorMapView } from "@/components/work-order-details/VendorMapView";
import { Shadows } from "@/constants/Styles";
import { useAuthStore } from "@/context/auth-store";
import axios from "@/lib/axios.config";
import {
  VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL,
  VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL,
  VENDOR_UPDATE_WORK_ORDER_DETAILS_URL,
  VENDOR_STAFF_UPDATE_WORK_ORDER_DETAILS_URL,
} from "@/lib/api-endpoints";
import {
  WorkOrderMinimalTabBar,
  WorkOrderDetailsTab,
  WorkOrderAttachmentsTab,
  WorkOrderActivityTab,
  WorkOrderTabKey,
  BarcodeScanner,
} from "@/components/work-order-edit";
import WorkOrderCompletionModal, {
  SettlementData,
} from "@/components/work-order-details/WorkOrderCompletionModal";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useRouteDirections } from "@/hooks/useRouteDirections";
import { useVendorLocationTracker } from "@/hooks/useVendorLocationTracker";
import { useWorkOrderActions } from "@/hooks/useWorkOrderActions";
import { showFloatingBubble } from "@/lib/floatingBubble";
import {
  formatDistanceLabel,
  getManeuverIcon,
  IoniconName,
  isValidLatLng,
  projectOntoPolyline,
  resolveActiveStep,
} from "@/lib/geo";
import {
  startVendorBackgroundNavigation,
  clearVendorActiveWorkOrderTracking,
} from "@/lib/vendorBackgroundLocation";
import { WorkOrder } from "@/types/work-order";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from "@gorhom/bottom-sheet";
import { requireOptionalNativeModule } from "expo-modules-core";
import { router } from "expo-router";
import type * as SpeechType from "expo-speech";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

let cachedSpeechModule: typeof SpeechType | null | undefined;
function getSpeechModule(): typeof SpeechType | null {
  if (cachedSpeechModule !== undefined) return cachedSpeechModule;
  try {
    if (!requireOptionalNativeModule("ExpoSpeech")) {
      cachedSpeechModule = null;
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedSpeechModule = require("expo-speech") as typeof SpeechType;
    return cachedSpeechModule;
  } catch {
    cachedSpeechModule = null;
    return null;
  }
}

export interface TechnicianWorkOrderNavigationScreenProps {
  workOrder: WorkOrder;
  id?: string | number;
  accepting: boolean;
  rejecting?: boolean;
  updatingStatus?: boolean;
  isPendingAcceptance?: boolean;
  isAccepted?: boolean;
  currentStatusSlug?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  handleAccept: () => Promise<void>;
  handleReject?: (reason: string) => Promise<void>;
  handleUpdateStatus?: (remarks: string) => Promise<void>;
  showStatusUpdateModal?: (
    statusSlug: string,
    subStatusSlug: string,
    statusName: string,
  ) => void;
  [key: string]: unknown;
}

// Pakistani metropolitan centers used only when a work order has neither exact nor area coordinates
const CITY_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  karachi: { latitude: 24.8607, longitude: 67.0011 },
  lahore: { latitude: 31.5204, longitude: 74.3587 },
  islamabad: { latitude: 33.6844, longitude: 73.0479 },
  rawalpindi: { latitude: 33.5651, longitude: 73.0169 },
  faisalabad: { latitude: 31.4504, longitude: 73.135 },
  multan: { latitude: 30.1575, longitude: 71.5249 },
  peshawar: { latitude: 34.0151, longitude: 71.5249 },
};

const OFF_ROUTE_THRESHOLD_METERS = 55;
const REROUTE_COOLDOWN_MS = 15_000;

function WorkStartedTimerCard({
  workOrder,
  sessionStartTime,
}: {
  workOrder: WorkOrder;
  sessionStartTime: number;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const startTimestamp = useMemo(() => {
    if (workOrder.service_start_date && workOrder.service_start_time) {
      const parsed = Date.parse(
        `${workOrder.service_start_date}T${workOrder.service_start_time}`,
      );
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (workOrder.updated_at) {
      const parsed = Date.parse(workOrder.updated_at);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return sessionStartTime;
  }, [
    workOrder.service_start_date,
    workOrder.service_start_time,
    workOrder.updated_at,
    sessionStartTime,
  ]);

  useEffect(() => {
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      setElapsedSeconds(diff);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTimestamp]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <View style={styles.timerCard}>
      <View style={styles.timerHeaderRow}>
        <View style={styles.timerLiveDot} />
        <Text style={styles.timerHeading}>SERVICE WORK IN PROGRESS</Text>
      </View>
      <Text style={styles.timerDigits}>{formattedTime}</Text>
      <Text style={styles.timerSubText}>Elapsed time since work started</Text>
    </View>
  );
}

export default function TechnicianWorkOrderNavigationScreen({
  workOrder,
  accepting,
  handleAccept,
  isAccepted,
  onRefresh,
  refreshing = false,
}: TechnicianWorkOrderNavigationScreenProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<VendorMapHandle | null>(null);

  // Bottom Sheet index state: 0 = 25% (collapsed), 1 = 50% (expanded default)
  const [sheetIndex, setSheetIndex] = useState<number>(1);

  // Voice assistant state
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const lastSpokenKeyRef = useRef<string>("");
  const lastRerouteAtRef = useRef<number>(0);

  // Navigation Lifecycle States
  const appMode = useAuthStore((state) => state.appMode);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const [arriving, setArriving] = useState<boolean>(false);
  const [startingWork, setStartingWork] = useState<boolean>(false);
  const [hasStartedWorkInSession, setHasStartedWorkInSession] = useState<boolean>(false);

  // Check if work has already started (persists when leaving and re-opening the screen)
  const isWorkAlreadyStarted = Boolean(
    workOrder.sub_status?.slug === "work-started" ||
      workOrder.sub_status?.slug === "work-in-progress" ||
      (workOrder.status?.slug === "in-progress" &&
        !["going-to-work", "reached-location", "arrived", "on-the-way"].includes(
          workOrder.sub_status?.slug || "",
        )) ||
      workOrder.service_start_date ||
      workOrder.service_start_time,
  );
  const isWorkStarted = isWorkAlreadyStarted || hasStartedWorkInSession;

  // Live in-progress service elapsed timer (persists across saves, auto-saves and tab switches)
  const startTimestamp = useMemo(() => {
    // 1. Try service_start_date & service_start_time from backend
    if (workOrder.service_start_date) {
      const cleanDate = String(workOrder.service_start_date).split("T")[0];
      if (workOrder.service_start_time) {
        const cleanTime = String(workOrder.service_start_time).split(" ")[0];
        const parsed = Date.parse(`${cleanDate}T${cleanTime}`);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      const parsedOnlyDate = Date.parse(String(workOrder.service_start_date));
      if (!isNaN(parsedOnlyDate) && parsedOnlyDate > 0) return parsedOnlyDate;
    }

    // 2. Try history logs for start of work
    if (Array.isArray(workOrder.histories)) {
      const startHistory = workOrder.histories.find(
        (h) =>
          h.action_type === "start_work" ||
          h.action_type === "work_started" ||
          h.description?.toLowerCase().includes("started") ||
          h.metadata?.status === "work-started"
      );
      if (startHistory?.created_at) {
        const parsed = Date.parse(startHistory.created_at);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }

    // 3. Fallback to session start time reference (NEVER uses updated_at which changes on every save)
    return sessionStartTimeRef.current;
  }, [
    workOrder.service_start_date,
    workOrder.service_start_time,
    workOrder.histories,
  ]);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isWorkStarted) return;
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
      setElapsedSeconds(diff);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isWorkStarted, startTimestamp]);

  const timerHours = Math.floor(elapsedSeconds / 3600);
  const timerMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const timerSecs = elapsedSeconds % 60;
  const formattedCountdown = `${timerHours.toString().padStart(2, "0")}:${timerMinutes
    .toString()
    .padStart(2, "0")}:${timerSecs.toString().padStart(2, "0")}`;

  // Full-Screen In-Progress Execution Tab State
  const [activeFsTab, setActiveFsTab] = useState<WorkOrderTabKey>("details");
  const [isSavingFsDetails, setIsSavingFsDetails] = useState(false);
  const [fsAutoSaveStatus, setFsAutoSaveStatus] = useState<"idle" | "unsaved" | "saving" | "saved">("idle");
  const [fsFormData, setFsFormData] = useState({
    indoor_serial_number: workOrder.indoor_serial_number || "",
    outdoor_serial_number: workOrder.outdoor_serial_number || "",
    product_indoor_model: workOrder.product_indoor_model || "",
    product_outdoor_model: workOrder.product_outdoor_model || "",
    warranty_card_serial:
      workOrder.warranty_card_serial ||
      (workOrder as any).warrenty_serial_number ||
      workOrder.warranty_serial_number ||
      "",
    warranty_serial_number:
      workOrder.warranty_card_serial ||
      (workOrder as any).warrenty_serial_number ||
      workOrder.warranty_serial_number ||
      "",
    purchase_date: workOrder.purchase_date || "",
    technician_remarks: workOrder.technician_remarks || "",
    service_concern_id: workOrder.service_concern?.id || null,
    service_sub_concern_id: workOrder.service_sub_concern?.id || null,
    warranty_type_id: workOrder.warranty_type?.id || null,
  });

  const lastSavedJsonRef = useRef<string>(JSON.stringify(fsFormData));
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const handleFsFormChange = useCallback((key: string, value: any) => {
    setFsFormData((prev) => {
      const next: typeof prev = { ...prev, [key]: value };
      if (key === "warranty_serial_number" || key === "warranty_card_serial") {
        next.warranty_serial_number = value;
        next.warranty_card_serial = value;
      }
      return next;
    });
  }, []);

  // Smooth debounced auto-save effect (1200ms of inactivity)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentJson = JSON.stringify(fsFormData);
    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    setFsAutoSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setFsAutoSaveStatus("saving");
        await axios.post(
          VENDOR_UPDATE_WORK_ORDER_DETAILS_URL(Number(workOrder.id)),
          fsFormData
        );
        lastSavedJsonRef.current = currentJson;
        setFsAutoSaveStatus("saved");
        setTimeout(() => {
          setFsAutoSaveStatus((c) => (c === "saved" ? "idle" : c));
        }, 3000);
      } catch (err) {
        console.warn("Auto-save silent error:", err);
        setFsAutoSaveStatus("unsaved");
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fsFormData, workOrder.id]);

  const handleFsSaveDetails = useCallback(async () => {
    try {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setIsSavingFsDetails(true);
      setFsAutoSaveStatus("saving");
      const isStaff = appMode === "vendor_staff";
      const updateDetailsUrl = isStaff
        ? VENDOR_STAFF_UPDATE_WORK_ORDER_DETAILS_URL(Number(workOrder.id))
        : VENDOR_UPDATE_WORK_ORDER_DETAILS_URL(Number(workOrder.id));
      await axios.post(updateDetailsUrl, fsFormData);
      lastSavedJsonRef.current = JSON.stringify(fsFormData);
      setFsAutoSaveStatus("saved");
      Toast.show({
        type: "success",
        text1: "Saved",
        text2: "Work order details updated successfully",
      });
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setFsAutoSaveStatus((c) => (c === "saved" ? "idle" : c));
      }, 3000);
    } catch (e: any) {
      setFsAutoSaveStatus("unsaved");
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: e?.response?.data?.message || "Could not save details",
      });
    } finally {
      setIsSavingFsDetails(false);
    }
  }, [workOrder.id, fsFormData, onRefresh]);

  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const handlePullToRefresh = useCallback(async () => {
    try {
      setIsPullRefreshing(true);
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setIsPullRefreshing(false);
    }
  }, [onRefresh]);

  // File Upload hook for Full-Screen In-Progress mode
  const fsFileUpload = useFileUpload({
    workOrderId: Number(workOrder.id),
    onSuccess: (msg) => {
      Toast.show({ type: "success", text1: "Upload Success", text2: msg });
      if (onRefresh) onRefresh();
    },
    onError: (msg) => {
      Toast.show({ type: "error", text1: "Upload Failed", text2: msg });
    },
    onFilesChanged: () => {
      if (onRefresh) onRefresh();
    },
  });

  // Barcode Scanner for Full-Screen mode (auto-attaches scanned photo as document)
  const fsScanner = useBarcodeScanner({
    onIndoorScanned: (data, imageUri) => {
      handleFsFormChange("indoor_serial_number", data);
      if (imageUri) {
        const ft = fsFileUpload.fileTypes.find(
          (f) =>
            f.slug === "indoor-serial" ||
            f.name?.toLowerCase().includes("indoor serial") ||
            f.name?.toLowerCase().includes("serial")
        );
        if (ft) {
          fsFileUpload.uploadDirectFile(imageUri, ft.id);
          Toast.show({
            type: "success",
            text1: "Indoor Serial Scanned",
            text2: `${data} saved and photo attached`,
          });
        }
      }
    },
    onOutdoorScanned: (data, imageUri) => {
      handleFsFormChange("outdoor_serial_number", data);
      if (imageUri) {
        const ft = fsFileUpload.fileTypes.find(
          (f) =>
            f.slug === "outdoor-serial" ||
            f.name?.toLowerCase().includes("outdoor serial")
        );
        if (ft) {
          fsFileUpload.uploadDirectFile(imageUri, ft.id);
          Toast.show({
            type: "success",
            text1: "Outdoor Serial Scanned",
            text2: `${data} saved and photo attached`,
          });
        }
      }
    },
    onWarrantyScanned: (data, imageUri) => {
      handleFsFormChange("warranty_serial_number", data);
      if (imageUri) {
        const ft = fsFileUpload.fileTypes.find(
          (f) =>
            f.slug === "warranty-card" ||
            f.name?.toLowerCase().includes("warranty")
        );
        if (ft) {
          fsFileUpload.uploadDirectFile(imageUri, ft.id);
          Toast.show({
            type: "success",
            text1: "Warranty Scanned",
            text2: `${data} saved and photo attached`,
          });
        }
      }
    },
    onError: (msg) => {
      Toast.show({ type: "error", text1: "Scan Failed", text2: msg });
    },
  });

  const fsRequiredCount = useMemo(() => {
    return (
      workOrder.parent_service?.required_file_types?.filter((rf) => rf.is_required)?.length || 0
    );
  }, [workOrder.parent_service]);

  const fsUploadedReqCount = useMemo(() => {
    const reqIds = new Set(
      workOrder.parent_service?.required_file_types
        ?.filter((rf) => rf.is_required)
        ?.map((rf) => rf.file_type_id) || []
    );
    return (workOrder.files || []).filter((f) =>
      reqIds.has(f.file_type?.id || (f as any).file_type_id)
    ).length;
  }, [workOrder.files, workOrder.parent_service]);

  const fsIsWarrantyCase = useMemo(() => {
    const wTypeId = Number(fsFormData.warranty_type_id || workOrder.warranty_type?.id);
    return [1, 3, 7].includes(wTypeId) || Boolean(workOrder.is_warranty_case);
  }, [fsFormData.warranty_type_id, workOrder]);

  // Completion Validation & Missing Items
  const fsHasRejectedRequiredFile = useMemo(() => {
    const reqIds = new Set(
      workOrder.parent_service?.required_file_types
        ?.filter((rf) => rf.is_required)
        ?.map((rf) => rf.file_type_id) || []
    );
    return (workOrder.files || []).some(
      (f) =>
        reqIds.has(f.file_type?.id || (f as any).file_type_id) &&
        f.approval_status === "rejected"
    );
  }, [workOrder.files, workOrder.parent_service]);

  const fsRemarksLength = useMemo(() => {
    return (fsFormData.technician_remarks || "").trim().length;
  }, [fsFormData.technician_remarks]);

  const fsHasValidRemarks = fsRemarksLength >= 20;

  const fsHasAllRequiredAttachments =
    fsRequiredCount === 0 || fsUploadedReqCount >= fsRequiredCount;

  const fsMissingItems = useMemo(() => {
    const missing: string[] = [];
    if (!fsHasAllRequiredAttachments) {
      missing.push(
        `Required photos (${fsUploadedReqCount}/${fsRequiredCount} attached)`
      );
    }
    if (fsHasRejectedRequiredFile) {
      missing.push("Re-upload rejected attachment(s)");
    }
    if (!fsHasValidRemarks) {
      missing.push(
        `Technician remarks (min 20 characters, current: ${fsRemarksLength})`
      );
    }
    return missing;
  }, [
    fsHasAllRequiredAttachments,
    fsUploadedReqCount,
    fsRequiredCount,
    fsHasRejectedRequiredFile,
    fsHasValidRemarks,
    fsRemarksLength,
  ]);

  const isFsCompletionReady = fsMissingItems.length === 0;

  const fsBottomBarPadding = useMemo(() => {
    // Generously clear bottom navigation (Android 3-button nav / gesture bar, iOS home bar, or persistent bottom tabs)
    const baseInset = insets.bottom || 0;
    return Math.max(baseInset + 14, Platform.OS === "android" ? 72 : 36);
  }, [insets.bottom]);

  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [isCompletingWorkOrder, setIsCompletingWorkOrder] = useState<boolean>(false);

  const handleConfirmCompletion = useCallback(
    async (settlementData: SettlementData) => {
      try {
        setIsCompletingWorkOrder(true);
        const isStaff = appMode === "vendor_staff";
        const statusUrl = isStaff
          ? VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id))
          : VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id));

        const subStatus = fsIsWarrantyCase ? "warranty-completed" : "work-completed";

        // Pre-sync all form details to database before final status transition
        try {
          const updateDetailsUrl = isStaff
            ? VENDOR_STAFF_UPDATE_WORK_ORDER_DETAILS_URL(Number(workOrder.id))
            : VENDOR_UPDATE_WORK_ORDER_DETAILS_URL(Number(workOrder.id));
          await axios.post(updateDetailsUrl, fsFormData);
        } catch (detailErr) {
          console.warn("Could not pre-sync details before completion:", detailErr);
        }

        await axios.post(statusUrl, {
          status_slug: "completed",
          sub_status_slug: subStatus,
          remarks: fsFormData.technician_remarks,
          customer_charged: settlementData.customer_charged,
          customer_charged_amount: settlementData.customer_charged_amount,
          customer_charge_remarks: settlementData.customer_charge_remarks,
          parts_used: settlementData.parts_used,
          parts_cost: settlementData.parts_cost,
          parts_remarks: settlementData.parts_remarks,
          labor_amount: settlementData.labor_amount,
          is_amount_received: settlementData.is_amount_received,
        });

        // Clear active navigation trip and tracking
        activeTripStore.setTrip(null);
        try {
          await clearVendorActiveWorkOrderTracking();
        } catch {}

        setShowCompletionModal(false);
        Toast.show({
          type: "success",
          text1: "🎉 Work Order Completed",
          text2: "Service successfully completed and settled.",
        });

        if (onRefresh) {
          await onRefresh();
        }

        router.replace("/vendor/(tabs)/jobs?status=completed");
      } catch (err: any) {
        console.error("Failed to complete work order:", err);
        const msg =
          err?.response?.data?.message ||
          "Could not complete work order. Please verify required fields & attachments.";
        Alert.alert("Completion Error", msg);
      } finally {
        setIsCompletingWorkOrder(false);
      }
    },
    [appMode, workOrder.id, fsIsWarrantyCase, fsFormData.technician_remarks, onRefresh]
  );

  const isAlreadyAccepted = Boolean(
    isAccepted ||
      workOrder.accepted_at ||
      (workOrder.status?.slug &&
        !["pending", "allocated", "offered"].includes(workOrder.status.slug)),
  );
  const isPoolJob = Boolean(
    workOrder.sub_status?.slug === "in-job-pool" ||
      (workOrder as any)?.is_in_job_pool ||
      !workOrder.assigned_vendor_id,
  );
  const [hasAcceptedInSession, setHasAcceptedInSession] = useState<boolean>(false);
  const isLocallyAccepted = isAlreadyAccepted || hasAcceptedInSession;

  const [isNavigating, setIsNavigating] = useState<boolean>(
    !isWorkStarted &&
      Boolean(
        workOrder.sub_status?.slug === "on-the-way" ||
          workOrder.sub_status?.slug === "going-to-work",
      ),
  );

  const [hasArrived, setHasArrived] = useState<boolean>(
    Boolean(
      workOrder.sub_status?.slug === "arrived" ||
        workOrder.sub_status?.slug === "reached-location",
    ),
  );

  // 1. Destination Coordinates Resolution
  const rawLat = parseFloat(String(workOrder.address?.latitude || 0));
  const rawLng = parseFloat(String(workOrder.address?.longitude || 0));
  const hasExactCoords =
    !isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0;

  const areaObj = workOrder.address?.main_service_area || null;
  const areaLat = parseFloat(String(areaObj?.latitude || 0));
  const areaLng = parseFloat(String(areaObj?.longitude || 0));
  const hasAreaCoords =
    !isNaN(areaLat) && !isNaN(areaLng) && areaLat !== 0 && areaLng !== 0;

  const cityName = (workOrder.address?.city || "Lahore").trim().toLowerCase();
  const cityDefault = CITY_CENTERS[cityName] || CITY_CENTERS.lahore;

  const destLat = hasExactCoords
    ? rawLat
    : hasAreaCoords
      ? areaLat
      : cityDefault.latitude;
  const destLng = hasExactCoords
    ? rawLng
    : hasAreaCoords
      ? areaLng
      : cityDefault.longitude;

  const areaName =
    areaObj?.name ||
    workOrder.address?.area ||
    workOrder.address?.city ||
    "Service Area";

  const destination = useMemo(
    () => ({ latitude: destLat, longitude: destLng }),
    [destLat, destLng],
  );

  const customerName = workOrder.customer?.name || "Customer";
  const isWorkOrderAccepted = Boolean(isAccepted || hasAcceptedInSession);

  // 2. Live Vendor GPS Location & Hardware Compass Tracker
  const {
    vendorLocation,
    compassHeading,
    distanceKm: fallbackDistanceKm,
    etaMins: fallbackEtaMins,
  } = useVendorLocationTracker({
    workOrderId: workOrder.id,
    workOrderNumber: workOrder.work_order_number || String(workOrder.id),
    customerName,
    isWorkOrderActive: isWorkOrderAccepted,
    destinationLat: destLat,
    destinationLng: destLng,
    enabled: true,
  });

  const hasVendorCoords = isValidLatLng(vendorLocation);
  const vLat = hasVendorCoords ? vendorLocation.latitude : destLat;
  const vLng = hasVendorCoords ? vendorLocation.longitude : destLng;
  const vSpeed = Number(vendorLocation?.speed) || 0;
  const vHeading = Number(vendorLocation?.heading);

  // Prefer true GPS course-over-ground when moving (>= 1.2 m/s); otherwise use damped compass heading
  const currentHeading =
    vSpeed >= 1.2 && Number.isFinite(vHeading) && vHeading >= 0
      ? vHeading
      : compassHeading || (Number.isFinite(vHeading) && vHeading >= 0 ? vHeading : 0);

  // 3. Google Routes API v2 Driving Route
  // In preview mode: uses Basic SKU (TRAFFIC_UNAWARE, no steps) to prevent extra charges.
  // In ride mode (isNavigating): switches to full navigation (TRAFFIC_AWARE, turn-by-turn steps).
  const {
    routeCoordinates,
    distanceMeters: routeDistanceMeters,
    durationSeconds: routeDurationSeconds,
    distanceKm: routeDistanceKm,
    etaMins: routeEtaMins,
    steps,
    loading: routeLoading,
    refetch: refetchRoute,
  } = useRouteDirections({
    origin: hasVendorCoords
      ? { latitude: vendorLocation.latitude, longitude: vendorLocation.longitude }
      : null,
    destination,
    enabled: hasVendorCoords,
    routingPreference: isNavigating ? "TRAFFIC_AWARE" : "TRAFFIC_UNAWARE",
    includeSteps: isNavigating,
    autoRefetchOnMove: !isNavigating,
  });

  // 4. Real-Time Road Projection, Polyline Trimming & Active Maneuver Tracking
  const routeProjection = useMemo(() => {
    if (!hasVendorCoords || routeCoordinates.length < 2) return null;
    return projectOntoPolyline(
      { latitude: vendorLocation.latitude, longitude: vendorLocation.longitude },
      routeCoordinates,
    );
  }, [hasVendorCoords, vendorLocation?.latitude, vendorLocation?.longitude, routeCoordinates]);

  const activeStep = useMemo(() => {
    if (!hasVendorCoords || !steps.length) return null;
    return resolveActiveStep(
      { latitude: vendorLocation.latitude, longitude: vendorLocation.longitude },
      steps,
      routeProjection,
    );
  }, [hasVendorCoords, vendorLocation?.latitude, vendorLocation?.longitude, steps, routeProjection]);

  const displayedRouteCoordinates = useMemo(() => {
    if (isNavigating && routeProjection && routeProjection.remainingCoordinates.length > 1) {
      return routeProjection.remainingCoordinates;
    }
    return routeCoordinates;
  }, [isNavigating, routeProjection, routeCoordinates]);

  const traveledRouteCoordinates = useMemo(() => {
    if (isNavigating && routeProjection && routeProjection.traveledCoordinates.length > 1) {
      return routeProjection.traveledCoordinates;
    }
    return undefined;
  }, [isNavigating, routeProjection]);

  // Remaining distance in meters & km (live-trimmed along the road polyline)
  const remainingDistanceMeters = useMemo(() => {
    if (routeProjection) {
      return Math.round(routeProjection.remainingDistanceMeters);
    }
    if (routeDistanceMeters !== null) {
      return routeDistanceMeters;
    }
    if (fallbackDistanceKm !== null) {
      return Math.round(fallbackDistanceKm * 1000);
    }
    return null;
  }, [routeProjection, routeDistanceMeters, fallbackDistanceKm]);

  const effectiveDistanceKm = useMemo(() => {
    if (remainingDistanceMeters !== null) {
      return parseFloat((remainingDistanceMeters / 1000).toFixed(2));
    }
    return routeDistanceKm ?? fallbackDistanceKm;
  }, [remainingDistanceMeters, routeDistanceKm, fallbackDistanceKm]);

  // Live remaining ETA scaled by remaining road fraction
  const effectiveEtaMins = useMemo(() => {
    if (
      routeProjection &&
      routeProjection.totalDistanceMeters > 50 &&
      routeDurationSeconds !== null
    ) {
      const ratio = Math.min(
        1,
        Math.max(0, routeProjection.remainingDistanceMeters / routeProjection.totalDistanceMeters),
      );
      return Math.max(1, Math.round((routeDurationSeconds * ratio) / 60));
    }
    return routeEtaMins ?? fallbackEtaMins;
  }, [routeProjection, routeDurationSeconds, routeEtaMins, fallbackEtaMins]);

  // Dynamic Arrival Clock Time (only computed when real ETA is known)
  const [formattedEtaTime, setFormattedEtaTime] = useState<string>("--:--");
  useEffect(() => {
    if (effectiveEtaMins === null || effectiveEtaMins === undefined) {
      setFormattedEtaTime("--:--");
      return;
    }
    const updateClock = () => {
      const etaDate = new Date(Date.now() + effectiveEtaMins * 60 * 1000);
      setFormattedEtaTime(
        etaDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, [effectiveEtaMins]);

  const destinationTitle = hasExactCoords ? customerName : areaName;

  const maneuverIconName = useMemo((): IoniconName => {
    if (hasArrived) return "checkmark-circle";
    if (remainingDistanceMeters !== null && remainingDistanceMeters < 45) {
      return "flag";
    }
    return getManeuverIcon(activeStep?.maneuver, activeStep?.instruction);
  }, [hasArrived, remainingDistanceMeters, activeStep?.maneuver, activeStep?.instruction]);

  const nextManeuverIconName = useMemo((): IoniconName => {
    return getManeuverIcon(activeStep?.nextStepManeuver, activeStep?.nextStepInstruction || undefined);
  }, [activeStep?.nextStepManeuver, activeStep?.nextStepInstruction]);

  // 5. Voice Assistant Speech Functionality
  const speakText = useCallback(
    (text: string, dedupeKey?: string) => {
      if (isVoiceMuted || !text) return;
      const key = dedupeKey || text;
      if (lastSpokenKeyRef.current === key) return;
      lastSpokenKeyRef.current = key;

      try {
        const speech = getSpeechModule();
        if (speech) {
          speech.stop();
          speech.speak(text, { language: "en", rate: 0.96 });
        }
      } catch {}
    },
    [isVoiceMuted],
  );

  useEffect(() => {
    return () => {
      try {
        getSpeechModule()?.stop();
      } catch {}
    };
  }, []);

  // Off-route detection -> automatic reroute
  useEffect(() => {
    if (!isNavigating || hasArrived || routeLoading || !routeProjection) return;
    if (routeProjection.distanceFromRouteMeters <= OFF_ROUTE_THRESHOLD_METERS) return;

    const now = Date.now();
    if (now - lastRerouteAtRef.current < REROUTE_COOLDOWN_MS) return;
    lastRerouteAtRef.current = now;

    refetchRoute();
    speakText("Recalculating route.", `reroute-${ Math.floor(now / REROUTE_COOLDOWN_MS) }`);
  }, [isNavigating, hasArrived, routeLoading, routeProjection, refetchRoute, speakText]);

  // Turn-by-turn milestone voice prompts (announces step changes + 500m / 150m / 40m thresholds)
  useEffect(() => {
    if (!isNavigating || hasArrived || !activeStep) return;

    const d = activeStep.distanceToTurnMeters;
    const stepIdx = activeStep.stepIndex;
    const instruction = activeStep.instruction;

    if (d <= 45) {
      speakText(instruction, `step-${stepIdx}-now`);
    } else if (d <= 160) {
      speakText(`In ${Math.round(d / 10) * 10} meters, ${instruction}`, `step-${stepIdx}-150m`);
    } else if (d <= 520) {
      speakText(`In 500 meters, ${instruction}`, `step-${stepIdx}-500m`);
    } else {
      speakText(
        `Continue for ${formatDistanceLabel(d)}, then ${instruction}`,
        `step-${stepIdx}-init`,
      );
    }
  }, [isNavigating, hasArrived, activeStep, speakText]);

  // 6. Camera Management:
  // Always keep the camera focused on the rider/technician's live GPS location
  // (using throttled updates so the map never vibrates when stationary on a table).
  const lastCameraUpdateRef = useRef<{
    lat: number;
    lng: number;
    heading: number;
    isNav: boolean;
    timestamp: number;
  }>({ lat: 0, lng: 0, heading: 0, isNav: false, timestamp: 0 });

  useEffect(() => {
    if (!mapRef.current) return;

    if (!hasVendorCoords) {
      if (lastCameraUpdateRef.current.timestamp === 0) {
        mapRef.current.animateCamera(
          {
            center: { latitude: destLat, longitude: destLng },
            zoom: 15.5,
            pitch: 0,
            heading: 0,
          },
          { duration: 400 },
        );
      }
      return;
    }

    const now = Date.now();
    const prev = lastCameraUpdateRef.current;
    const isInitialOrModeSwitch =
      prev.timestamp === 0 || prev.isNav !== isNavigating;
    const latChanged = Math.abs(vLat - prev.lat) > 0.00004;
    const lngChanged = Math.abs(vLng - prev.lng) > 0.00004;
    const headingDiff = Math.abs(
      ((((currentHeading - prev.heading) % 360) + 540) % 360) - 180,
    );
    // Only rotate camera with heading during active navigation
    const headingThreshold = vSpeed < 0.8 ? 25 : 12;
    const headingChanged = isNavigating && headingDiff >= headingThreshold;

    if (
      !isInitialOrModeSwitch &&
      ((now - prev.timestamp < 850 && !latChanged && !lngChanged) ||
        (!latChanged && !lngChanged && !headingChanged))
    ) {
      return;
    }

    lastCameraUpdateRef.current = {
      lat: vLat,
      lng: vLng,
      heading: isNavigating ? currentHeading : 0,
      isNav: isNavigating,
      timestamp: now,
    };

    mapRef.current.animateCamera(
      {
        center: { latitude: vLat, longitude: vLng },
        zoom: isNavigating ? 17.5 : 16.2,
        pitch: isNavigating ? 55 : 0,
        heading: isNavigating ? currentHeading : 0,
      },
      { duration: isInitialOrModeSwitch ? 650 : 500 },
    );
  }, [
    isNavigating,
    vLat,
    vLng,
    vSpeed,
    currentHeading,
    destLat,
    destLng,
    hasVendorCoords,
  ]);

  // Snap points strictly: 25% (collapsed on map click / start nav) and 50% (default open / sheet click)
  const snapPoints = useMemo(() => ["25%", "50%"], []);

  // Critically-damped native UI-thread spring for smooth 25% <-> 50% sheet transitions
  const sheetSpringConfigs = useBottomSheetSpringConfigs({
    damping: 32,
    stiffness: 220,
    mass: 0.9,
    overshootClamping: true,
  });

  // Tracks the bottom sheet's top Y pixel coordinate on the UI thread (60/120fps)
  const sheetAnimatedPosition = useSharedValue(windowHeight * 0.5);

  const floatingPillAnimatedStyle = useAnimatedStyle(() => {
    const sheetHeight = Math.max(
      windowHeight * 0.24,
      Math.min(windowHeight * 0.56, windowHeight - sheetAnimatedPosition.value),
    );
    return {
      bottom: sheetHeight + 12,
    };
  }, [windowHeight]);

  const floatingControlsAnimatedStyle = useAnimatedStyle(() => {
    const sheetHeight = Math.max(
      windowHeight * 0.24,
      Math.min(windowHeight * 0.56, windowHeight - sheetAnimatedPosition.value),
    );
    return {
      bottom: sheetHeight + 16,
    };
  }, [windowHeight]);

  const collapseSheetTo25 = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0, sheetSpringConfigs);
    setSheetIndex(0);
  }, [sheetSpringConfigs]);

  const expandSheetTo50 = useCallback(() => {
    if (sheetIndex === 0) {
      bottomSheetRef.current?.snapToIndex(1, sheetSpringConfigs);
      setSheetIndex(1);
    }
  }, [sheetIndex, sheetSpringConfigs]);

  const handleMapTouch = useCallback(() => {
    if (sheetIndex > 0) {
      collapseSheetTo25();
    }
  }, [sheetIndex, collapseSheetTo25]);

  const handleRecenterCamera = useCallback(() => {
    if (sheetIndex > 0) {
      collapseSheetTo25();
    }
    if (!mapRef.current) return;
    mapRef.current.animateCamera(
      {
        center: {
          latitude: hasVendorCoords ? vLat : destLat,
          longitude: hasVendorCoords ? vLng : destLng,
        },
        zoom: isNavigating ? 17.5 : 16.2,
        pitch: isNavigating ? 55 : 0,
        heading: isNavigating ? currentHeading : 0,
      },
      { duration: 650 },
    );
  }, [
    sheetIndex,
    collapseSheetTo25,
    isNavigating,
    hasVendorCoords,
    vLat,
    vLng,
    destLat,
    destLng,
    currentHeading,
  ]);

  const mapPadding = useMemo(
    () => ({
      top: Math.max(insets.top, 16) + 68,
      right: 16,
      bottom: Math.round(windowHeight * (sheetIndex === 0 ? 0.27 : 0.52)),
      left: 16,
    }),
    [insets.top, windowHeight, sheetIndex],
  );

  const { showAcceptModal, setShowAcceptModal, onAccept, onSkip } =
    useWorkOrderActions({
      handleAccept,
      accepting,
    });

  const handleConfirmAccept = useCallback(async () => {
    await onAccept();
    setHasAcceptedInSession(true);
  }, [onAccept]);

  const fullAddress = [
    workOrder.address?.address_line_1,
    workOrder.address?.area,
    workOrder.address?.city,
  ]
    .filter(Boolean)
    .join(", ");

  // Start Navigation Action
  const handleStartNavigation = useCallback(async () => {
    setIsNavigating(true);
    setHasArrived(false);
    lastSpokenKeyRef.current = "";
    collapseSheetTo25();
    try {
      await startVendorBackgroundNavigation(
        workOrder.id,
        workOrder.work_order_number || String(workOrder.id),
        customerName,
      );
    } catch {}

    // Notify backend that technician is on the way
    try {
      const isStaff = appMode === "vendor_staff";
      const statusUrl = isStaff
        ? VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id))
        : VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id));
      axios
        .post(statusUrl, {
          status_slug: "in-progress",
          sub_status_slug: "going-to-work",
        })
        .catch((e) => console.warn("Going-to-work update note:", e));
    } catch {}

    activeTripStore.setTrip({
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.work_order_number || String(workOrder.id),
      customerName,
      destinationLat: destLat,
      destinationLng: destLng,
      destAddress: fullAddress || areaName,
    });

    handleRecenterCamera();
    const firstPrompt = activeStep?.instruction
      ? `Starting navigation to ${destinationTitle}. ${activeStep.instruction}`
      : `Starting navigation to ${destinationTitle}.`;
    speakText(firstPrompt, "nav-start");
  }, [
    collapseSheetTo25,
    workOrder.id,
    workOrder.work_order_number,
    customerName,
    destLat,
    destLng,
    fullAddress,
    areaName,
    handleRecenterCamera,
    activeStep?.instruction,
    destinationTitle,
    speakText,
  ]);

  // Arrived Action -> Strictly updates status in backend BEFORE advancing local state
  const handleArrivedAction = useCallback(async () => {
    try {
      setArriving(true);
      const isStaff = appMode === "vendor_staff";
      const statusUrl = isStaff
        ? VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id))
        : VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id));
      await axios.post(statusUrl, {
        status_slug: "in-progress",
        sub_status_slug: "reached-location",
      });

      // ONLY advance state on successful API response
      activeTripStore.setTrip(null);
      setHasArrived(true);
      setIsNavigating(false);
      speakText(`You have arrived at ${destinationTitle}.`, "nav-arrived");
      Toast.show({
        type: "success",
        text1: "📍 Arrived at Location",
        text2: "Status updated. You can now tap Start Work.",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (e: any) {
      console.warn("Failed to update arrived status:", e);
      const msg =
        e?.response?.data?.message ||
        "Could not update arrival status. Please check connection and retry.";
      Toast.show({
        type: "error",
        text1: "Arrival Update Failed",
        text2: msg,
      });
    } finally {
      setArriving(false);
    }
  }, [destinationTitle, speakText, appMode, workOrder.id, onRefresh]);

  // Start Work Action -> Strictly updates status in backend BEFORE advancing local state
  const handleStartWork = useCallback(async () => {
    try {
      setStartingWork(true);
      const isStaff = appMode === "vendor_staff";
      const statusUrl = isStaff
        ? VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id))
        : VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(workOrder.id));
      await axios.post(statusUrl, {
        status_slug: "in-progress",
        sub_status_slug: "work-started",
      });

      // ONLY advance state on successful API response
      setHasStartedWorkInSession(true);
      Toast.show({
        type: "success",
        text1: "⚡ Work Started",
        text2: "Work duration timer started. Map dismissed.",
      });
      if (onRefresh) {
        onRefresh();
      }
    } catch (e: any) {
      console.warn("Failed to update work-started status:", e);
      const msg =
        e?.response?.data?.message ||
        "Could not start work. Please check connection and retry.";
      Toast.show({
        type: "error",
        text1: "Failed to Start Work",
        text2: msg,
      });
    } finally {
      setStartingWork(false);
    }
  }, [appMode, workOrder.id, onRefresh]);

  // Stop / Exit Navigation (keeps online location tracking running)
  const handleStopNavigation = useCallback(async () => {
    activeTripStore.setTrip(null);
    setIsNavigating(false);
    try {
      getSpeechModule()?.stop();
    } catch {}
  }, []);

  // Auto-arrival proximity trigger (< 35m)
  useEffect(() => {
    if (
      isNavigating &&
      !hasArrived &&
      remainingDistanceMeters !== null &&
      remainingDistanceMeters < 35
    ) {
      const timer = setTimeout(() => {
        void handleArrivedAction();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, hasArrived, remainingDistanceMeters, handleArrivedAction]);

  const rawPayout =
    workOrder.grand_total ??
    workOrder.total_amount ??
    workOrder.final_amount;

  const numericPayout = Number(rawPayout);
  const formattedPayout =
    Number.isFinite(numericPayout) && numericPayout > 0
      ? `₨ ${numericPayout.toLocaleString()}`
      : null;

  const formatSlot = () => {
    if (workOrder.appointment_date) {
      try {
        const d = new Date(workOrder.appointment_date);
        const dateStr = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return workOrder.appointment_time
          ? `${dateStr}, ${workOrder.appointment_time}`
          : dateStr;
      } catch {
        return workOrder.appointment_date;
      }
    }
    return "Scheduled Service";
  };

  const dynamicDistanceText = useMemo(
    () => formatDistanceLabel(remainingDistanceMeters),
    [remainingDistanceMeters],
  );

  const maneuverDistanceText = useMemo(() => {
    if (hasArrived) return "0 m";
    if (activeStep) {
      return formatDistanceLabel(activeStep.distanceToTurnMeters);
    }
    return dynamicDistanceText;
  }, [hasArrived, activeStep, dynamicDistanceText]);

  const maneuverHeadlineText = useMemo(() => {
    if (hasArrived) {
      return `Arrived at ${destinationTitle}`;
    }
    if (activeStep?.instruction) {
      return activeStep.instruction;
    }
    if (routeLoading) {
      return "Calculating route...";
    }
    return `Head toward ${fullAddress || destinationTitle}`;
  }, [hasArrived, destinationTitle, activeStep?.instruction, routeLoading, fullAddress]);

  const extraNotes =
    workOrder.notes ||
    workOrder.customer_description ||
    workOrder.defect_description ||
    workOrder.service_description ||
    workOrder.reminders ||
    null;

  const openExternalNavigation = () => {
    void showFloatingBubble(
      workOrder.work_order_number ? `#${workOrder.work_order_number}` : "Online",
    );
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${destLat},${destLng}&directionsmode=driving`,
      default: `google.navigation:q=${destLat},${destLng}&mode=d`,
    });
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(fallbackUrl);
      });
    }
  };

  const initialRegion = useMemo(
    () => ({
      latitude: hasVendorCoords ? vLat : destLat,
      longitude: hasVendorCoords ? vLng : destLng,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }),
    [hasVendorCoords, vLat, vLng, destLat, destLng],
  );

  const { orderTypeLabel, isWarranty } = useMemo(() => {
    const rawWarrantyType = workOrder.warranty_type?.name;
    const isWarrantyCase = Boolean(
      workOrder.is_warranty_case ||
        (rawWarrantyType && rawWarrantyType.toLowerCase().includes("warranty")) ||
        (workOrder.warrentyStatus &&
          workOrder.warrentyStatus.toLowerCase().includes("warranty")),
    );

    let label = "Standard";
    if (rawWarrantyType) {
      label = rawWarrantyType;
    } else if ((workOrder as any).order_type) {
      label = String((workOrder as any).order_type);
    } else if ((workOrder as any).service_type) {
      const st = String((workOrder as any).service_type);
      label = st.charAt(0).toUpperCase() + st.slice(1);
    } else if ((workOrder as any).type) {
      label = String((workOrder as any).type);
    } else if (isWarrantyCase) {
      label = "Warranty";
    } else if (workOrder.warrentyStatus) {
      label = workOrder.warrentyStatus;
    }

    return { orderTypeLabel: label, isWarranty: isWarrantyCase };
  }, [
    workOrder.warranty_type,
    workOrder.is_warranty_case,
    workOrder.warrentyStatus,
    (workOrder as any).order_type,
    (workOrder as any).service_type,
    (workOrder as any).type,
  ]);

  // ─── FULL-SCREEN WORK ORDER UPDATE VIEW (HIDES MAP & BOTTOM SHEET) ───
  if (isWorkStarted) {
    return (
      <View style={[styles.fsContainer, { paddingTop: insets.top }]}>
        {/* Top Header: Transparent bg, Back Button, Mid: WO# & Service Type, Right: Countdown */}
        <View style={styles.fsHeader}>
          {/* 1. Left: Back Button (Flat, No Shadows) */}
          <TouchableOpacity
            style={styles.fsHeaderBackBtn}
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/vendor/(tabs)/jobs?status=active")
            }
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <DirectionalIcon name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          {/* 2. Mid: Work Order Number & Service Type */}
          <View style={styles.fsHeaderCenter}>
            <Text style={styles.fsHeaderTitle} numberOfLines={1}>
              {workOrder.work_order_number
                ? `Order #${workOrder.work_order_number}`
                : `Order #${workOrder.id}`}
            </Text>
            <Text style={styles.fsHeaderSubtitle} numberOfLines={1}>
              {workOrder.parent_service?.name ||
                workOrder.service?.name ||
                "Service Order"}
            </Text>
          </View>

          {/* 3. Right Corner: Countdown / In-Progress Timer */}
          <View style={styles.fsHeaderTimerBadge}>
            <View style={styles.fsHeaderTimerDot} />
            <Text style={styles.fsHeaderTimerDigits}>{formattedCountdown}</Text>
          </View>
        </View>

        {/* Minimal Tab Switcher (Details, Attachments, Activity) */}
        <WorkOrderMinimalTabBar
          activeTab={activeFsTab}
          onTabChange={setActiveFsTab}
          requiredAttachmentsCount={fsRequiredCount}
          uploadedAttachmentsCount={fsUploadedReqCount}
          activityCount={workOrder.histories?.length || 0}
        />

        {/* Scrollable Work Order Update View with KeyboardAvoidingView */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.fsScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={Boolean(refreshing || isPullRefreshing)}
                onRefresh={handlePullToRefresh}
                colors={["#0F172A"]}
                tintColor="#0F172A"
              />
            }
          >
            {activeFsTab === "details" && (
              <WorkOrderDetailsTab
                workOrder={workOrder}
                formData={fsFormData}
                setFormData={handleFsFormChange}
                onScanIndoor={() => fsScanner.openScanner("indoor")}
                onScanOutdoor={() => fsScanner.openScanner("outdoor")}
                onScanWarranty={() => fsScanner.openScanner("warranty")}
                onSave={handleFsSaveDetails}
                saving={isSavingFsDetails}
                autoSaveStatus={fsAutoSaveStatus}
              />
            )}

            {activeFsTab === "attachments" && (
              <WorkOrderAttachmentsTab
                workOrder={workOrder}
                files={workOrder.files || []}
                fileTypes={fsFileUpload.fileTypes}
                uploading={fsFileUpload.uploading}
                uploadingFileTypeId={fsFileUpload.uploadingFileTypeId}
                processing={fsFileUpload.processing}
                uploadData={fsFileUpload.uploadData}
                onSelectFileType={fsFileUpload.handleSelectFileType}
                onSelectCamera={fsFileUpload.handleSelectCamera}
                onSelectGallery={fsFileUpload.handleSelectGallery}
                onConfirmUpload={fsFileUpload.handleConfirmUpload}
                onCancelPreview={fsFileUpload.handleCancelPreview}
                showPreviewModal={fsFileUpload.showPreviewModal}
                onDelete={fsFileUpload.handleFileDelete}
                isWarrantyCase={fsIsWarrantyCase}
                captureAndUploadForType={fsFileUpload.captureAndUploadForType}
                uploadDirectFile={fsFileUpload.uploadDirectFile}
              />
            )}

            {activeFsTab === "activity" && (
              <WorkOrderActivityTab workOrder={workOrder} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ─── BOTTOM COMPLETION ACTION BAR ─── */}
        <View
          style={[
            styles.fsBottomCompleteBar,
            { paddingBottom: fsBottomBarPadding },
          ]}
        >
          {isFsCompletionReady ? (
            <TouchableOpacity
              style={styles.fsCompleteBtnReady}
              onPress={() => setShowCompletionModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
              <Text style={styles.fsCompleteBtnReadyText}>
                Complete Work Order
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.fsCompleteBtnPending}
              onPress={() => {
                Alert.alert(
                  "Requirements to Complete Job",
                  "Please finish the following before completing:\n\n• " +
                    fsMissingItems.join("\n• "),
                  [{ text: "OK" }]
                );
              }}
              activeOpacity={0.85}
            >
              <View style={styles.fsPendingLeft}>
                <View style={styles.fsPendingPill}>
                  <Text style={styles.fsPendingPillText}>
                    {fsMissingItems.length} requirement{fsMissingItems.length > 1 ? "s" : ""} left
                  </Text>
                </View>
                <Text style={styles.fsPendingSubText} numberOfLines={1}>
                  {fsMissingItems[0]}
                </Text>
              </View>

              <View style={styles.fsPendingRightBtn}>
                <Text style={styles.fsPendingRightBtnText}>Complete Job</Text>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Work Order Completion & Customer Settlement Modal */}
        <WorkOrderCompletionModal
          visible={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          workOrder={workOrder}
          onConfirmComplete={handleConfirmCompletion}
          isCompleting={isCompletingWorkOrder}
        />

        {/* Barcode Scanner */}
        <BarcodeScanner
          visible={fsScanner.showScanner}
          scanningField={fsScanner.scanningField}
          onBarcodeScanned={({ data, imageUri }) =>
            fsScanner.onBarcodeScanned(data, imageUri)
          }
          onClose={fsScanner.closeScanner}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── 1. PROVIDER-INDEPENDENT FULLSCREEN MAP ─── */}
      <View style={StyleSheet.absoluteFill}>
        <VendorMapView
          mapRef={mapRef}
          initialRegion={initialRegion}
          vendorLocation={vendorLocation}
          compassHeading={currentHeading}
          lat={destLat}
          lng={destLng}
          hasExactCoords={hasExactCoords}
          hasAreaCoords={hasAreaCoords}
          routeCoordinates={displayedRouteCoordinates}
          traveledCoordinates={traveledRouteCoordinates}
          isNavigating={isNavigating}
          onMapTouch={handleMapTouch}
          mapPadding={mapPadding}
        />
      </View>

      {/* ─── 2. FLOATING DESTINATION / ROAD PILL (ONLY DURING ACTIVE NAVIGATION / ARRIVAL) ─── */}
      {(isNavigating || hasArrived) && (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(160)}
          style={[styles.floatingStreetPillWrap, floatingPillAnimatedStyle]}
          pointerEvents="none"
        >
          <View style={styles.floatingStreetPill}>
            <Ionicons name="navigate" size={12} color="#60A5FA" style={{ marginRight: 6 }} />
            <Text style={styles.floatingStreetText} numberOfLines={1}>
              {hasArrived
                ? `Arrived at ${destinationTitle}`
                : fullAddress || areaName}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ─── 3. DYNAMIC NATIVE TOP HEADER ─── */}
      <View
        style={[styles.topHeaderBar, { top: Math.max(insets.top, 16) + 4 }]}
        pointerEvents="box-none"
      >
        {sheetIndex === 0 ? (
          /* COLLAPSED AT 25%: State-aware Header Actions */
          <Animated.View
            key="header-collapsed-25"
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(160)}
            style={styles.collapsedHeaderRow}
          >
            {!isLocallyAccepted ? (
              <TouchableOpacity
                style={styles.headerRoundBtnDanger}
                onPress={onSkip}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#EF4444" />
              </TouchableOpacity>
            ) : isNavigating ? (
              <TouchableOpacity
                style={styles.headerRoundBtnDanger}
                onPress={handleStopNavigation}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={20} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.floatingRoundBtn}
                onPress={() => (router.canGoBack() ? router.back() : onSkip())}
                activeOpacity={0.8}
              >
                <DirectionalIcon name="arrow-back" size={20} color="#0F172A" />
              </TouchableOpacity>
            )}

            <View style={styles.headerTitleCenterBadge}>
              <Text style={styles.headerTitleCenterText} numberOfLines={1}>
                {hasArrived
                  ? "Destination Reached"
                  : isNavigating
                    ? maneuverHeadlineText
                    : destinationTitle}
              </Text>
              <Text style={styles.headerSubtitleText} numberOfLines={1}>
                {hasArrived
                  ? "You have arrived"
                  : isNavigating
                    ? `${maneuverDistanceText} • ${dynamicDistanceText} total`
                    : `${dynamicDistanceText} • ${workOrder.parent_service?.name || "Service"}`}
              </Text>
            </View>

            {!isLocallyAccepted ? (
              <TouchableOpacity
                style={[
                  styles.headerAcceptBtn,
                  isPoolJob && { backgroundColor: "#7C3AED" },
                  accepting && styles.btnDisabled,
                ]}
                onPress={() => setShowAcceptModal(true)}
                disabled={accepting}
                activeOpacity={0.85}
              >
                {accepting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={isPoolJob ? "flash" : "checkmark-circle"}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.headerAcceptBtnText}>
                      {isPoolJob ? "Claim" : "Accept"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : isNavigating ? (
              <TouchableOpacity
                style={[styles.headerArriveBtn, arriving && styles.btnDisabled]}
                onPress={handleArrivedAction}
                disabled={arriving}
                activeOpacity={0.85}
              >
                {arriving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.headerAcceptBtnText}>Arrived</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : hasArrived ? (
              <TouchableOpacity
                style={styles.headerStartBtn}
                onPress={handleStartWork}
                disabled={startingWork}
                activeOpacity={0.85}
              >
                {startingWork ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="construct" size={15} color="#FFFFFF" />
                    <Text style={styles.headerAcceptBtnText}>Start Work</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.headerStartBtn}
                onPress={handleStartNavigation}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.headerAcceptBtnText}>Start</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : isNavigating || hasArrived ? (
          /* Real Turn-by-Turn Maneuver Banner during active navigation or arrival */
          <Animated.View
            key="header-maneuver-banner"
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(160)}
            style={styles.expandedHeaderBanner}
          >
            <View style={styles.maneuverLeftBox}>
              <Ionicons
                name={maneuverIconName}
                size={28}
                color="#FFFFFF"
              />
              <Text style={styles.maneuverDistanceText}>
                {maneuverDistanceText}
              </Text>
            </View>

            <View style={styles.maneuverCenterBox}>
              <Text style={styles.maneuverInstructionText} numberOfLines={2}>
                {maneuverHeadlineText}
              </Text>
              {!hasArrived && activeStep?.nextStepInstruction ? (
                <View style={styles.nextStepRow}>
                  <Text style={styles.nextStepLabel}>Then</Text>
                  <Ionicons
                    name={nextManeuverIconName}
                    size={13}
                    color="#A7F3D0"
                  />
                  <Text style={styles.nextStepText} numberOfLines={1}>
                    {activeStep.nextStepInstruction}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.bannerCloseBtn}
              onPress={handleStopNavigation}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Minimal header when not navigating */
          <Animated.View
            key="header-minimal-50"
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(160)}
            style={styles.collapsedHeaderRow}
          >
            <TouchableOpacity
              style={styles.floatingRoundBtn}
              onPress={() => (router.canGoBack() ? router.back() : onSkip())}
              activeOpacity={0.8}
            >
              <DirectionalIcon name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.headerTitleBadge}>
              <Text style={styles.topHeaderTitle}>
                {isLocallyAccepted
                  ? "Ready for Trip"
                  : isPoolJob
                    ? "⚡ Job Pool Opportunity"
                    : "Job Offer"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.floatingRoundBtn}
              onPress={handleRecenterCamera}
              activeOpacity={0.8}
            >
              <Ionicons name="locate" size={19} color="#0284C7" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* ─── 4. FLOATING MAP CONTROLS (Voice Mute during Navigation & Recenter) ─── */}
      <Animated.View
        layout={LinearTransition.springify().damping(26).stiffness(220)}
        style={[styles.floatingMapControls, floatingControlsAnimatedStyle]}
        pointerEvents="box-none"
      >
        {(isNavigating || sheetIndex === 0) && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
          >
            <TouchableOpacity
              style={styles.floatingRoundBtn}
              onPress={() => {
                const nextMute = !isVoiceMuted;
                setIsVoiceMuted(nextMute);
                if (nextMute) {
                  try {
                    getSpeechModule()?.stop();
                  } catch {}
                } else if (activeStep?.instruction) {
                  lastSpokenKeyRef.current = "";
                  speakText(activeStep.instruction, `unmute-${Date.now()}`);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isVoiceMuted ? "volume-mute" : "volume-high"}
                size={20}
                color={isVoiceMuted ? "#EF4444" : "#059669"}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        <TouchableOpacity
          style={styles.floatingRoundBtn}
          onPress={handleRecenterCamera}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-outline" size={20} color="#0284C7" />
        </TouchableOpacity>
      </Animated.View>

      {/* ─── 5. BOTTOM SHEET (DEFAULT 50%, 25% ON START NAV / MAP CLICK, 50% ON SHEET CLICK) ─── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        animationConfigs={sheetSpringConfigs}
        animatedPosition={sheetAnimatedPosition}
        enableDynamicSizing={false}
        onChange={(idx) => setSheetIndex(idx)}
        enableOverDrag={false}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContentContainer}
        >
          <Pressable onPress={expandSheetTo50}>
            <View style={styles.etaBarContainer}>
              <View>
                <Text style={styles.etaClockTime}>
                  {hasArrived
                    ? "Arrived"
                    : effectiveEtaMins !== null
                      ? `${effectiveEtaMins} min`
                      : routeLoading
                        ? "Routing..."
                        : formattedEtaTime}
                </Text>
                <Text style={styles.etaSubText}>
                  {hasArrived
                    ? "At customer location"
                    : effectiveEtaMins !== null
                      ? `${formattedEtaTime} arrival • ${dynamicDistanceText}`
                      : dynamicDistanceText}
                </Text>
              </View>

              {formattedPayout ? (
                <View style={styles.payoutBadge}>
                  <Text style={styles.payoutLabel}>Payout</Text>
                  <Text style={styles.payoutValue}>{formattedPayout}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.jobTitle} numberOfLines={2}>
                  {workOrder.parent_service?.name ||
                    workOrder.service?.name ||
                    workOrder.category?.name ||
                    "Service Order"}
                </Text>
                <Text style={styles.appointmentText}>{formatSlot()}</Text>
              </View>

              <TouchableOpacity
                style={styles.openMapsBtn}
                onPress={openExternalNavigation}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-circle" size={18} color="#059669" />
                <Text style={styles.openMapsBtnText}>Google Maps</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.customerRow}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {customerName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "TC"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerNameText}>{customerName}</Text>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {fullAddress || areaName}
                  </Text>
                </View>
              </View>
            </View>

            {extraNotes ? (
              <View style={styles.notesCard}>
                <View style={styles.notesHeader}>
                  <Ionicons name="document-text-outline" size={15} color="#D97706" />
                  <Text style={styles.notesTitle}>Special Instructions</Text>
                </View>
                <Text style={styles.notesBody}>{extraNotes}</Text>
              </View>
            ) : null}
          </Pressable>

          {/* ─── DYNAMIC ACTION BUTTONS (Accept -> Start -> Arrive -> Begin Work) ─── */}
          <View style={styles.actionsRow}>
            {!isLocallyAccepted ? (
              <>
                <TouchableOpacity
                  style={[styles.skipBtn, accepting && styles.btnDisabled]}
                  onPress={onSkip}
                  disabled={accepting}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#EF4444"
                  />
                  <Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.acceptBtn,
                    isPoolJob && { backgroundColor: "#7C3AED" },
                    accepting && styles.btnDisabled,
                  ]}
                  onPress={() => setShowAcceptModal(true)}
                  disabled={accepting}
                  activeOpacity={0.85}
                >
                  {accepting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={isPoolJob ? "flash" : "checkmark-circle"}
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.acceptBtnText}>
                        {isPoolJob ? "⚡ Claim Job" : "Accept Job"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : isNavigating ? (
              <>
                <TouchableOpacity
                  style={styles.exitNavBtn}
                  onPress={handleStopNavigation}
                  activeOpacity={0.85}
                >
                  <Ionicons name="stop-circle-outline" size={18} color="#64748B" />
                  <Text style={styles.exitNavBtnText}>Exit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.arriveBtn, arriving && styles.btnDisabled]}
                  onPress={handleArrivedAction}
                  disabled={arriving}
                  activeOpacity={0.85}
                >
                  {arriving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.acceptBtnText}>Arrived at Location</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : hasArrived ? (
              <TouchableOpacity
                style={styles.startTripBtn}
                onPress={handleStartWork}
                disabled={startingWork}
                activeOpacity={0.85}
              >
                {startingWork ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="construct" size={18} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>⚡ Start Work</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.startTripBtn}
                onPress={handleStartNavigation}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={19} color="#FFFFFF" />
                <Text style={styles.acceptBtnText}>Start Navigation</Text>
              </TouchableOpacity>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      <Modal
        visible={showAcceptModal}
        type="confirm"
        title={isPoolJob ? "⚡ Claim Job Pool Order" : "Accept Job"}
        message={
          isPoolJob
            ? "Are you ready to service this work order? Once claimed, it will move immediately to your active jobs."
            : "Are you sure you want to accept this job?"
        }
        actions={[
          {
            text: "Cancel",
            onPress: () => setShowAcceptModal(false),
            variant: "outline",
          },
          {
            text: isPoolJob ? "⚡ Claim Now" : "Accept",
            onPress: handleConfirmAccept,
            variant: "primary",
          },
        ]}
        onClose={() => setShowAcceptModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  topHeaderBar: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 25,
  },
  collapsedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerRoundBtnDanger: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    ...Shadows.md,
  },
  headerTitleCenterBadge: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.sm,
  },
  headerTitleCenterText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitleText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "700",
    marginTop: 1,
  },
  headerAcceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    ...Shadows.md,
  },
  headerStartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0284C7",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    ...Shadows.md,
  },
  headerArriveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    ...Shadows.md,
  },
  headerAcceptBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  headerTitleBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    ...Shadows.sm,
  },
  topHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  expandedHeaderBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#064E3B",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#047857",
    ...Shadows.lg,
  },
  maneuverLeftBox: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    minWidth: 52,
  },
  maneuverDistanceText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
  },
  maneuverCenterBox: {
    flex: 1,
    justifyContent: "center",
  },
  maneuverInstructionText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 19,
  },
  nextStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  nextStepLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A7F3D0",
    textTransform: "uppercase",
  },
  nextStepText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#D1FAE5",
  },
  bannerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  floatingMapControls: {
    position: "absolute",
    right: 14,
    zIndex: 20,
    gap: 10,
  },
  floatingRoundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Shadows.md,
  },
  floatingStreetPillWrap: {
    position: "absolute",
    bottom: "52%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 15,
  },
  floatingStreetPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    maxWidth: "88%",
    ...Shadows.sm,
  },
  floatingStreetText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Shadows.lg,
  },
  bottomSheetIndicator: {
    backgroundColor: "#CBD5E1",
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetContentContainer: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 36,
  },
  etaBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 10,
  },
  etaClockTime: {
    fontSize: 22,
    fontWeight: "900",
    color: "#059669",
    letterSpacing: -0.5,
  },
  etaSubText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 1,
  },
  payoutBadge: {
    alignItems: "flex-end",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  payoutLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#166534",
    textTransform: "uppercase",
  },
  payoutValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#059669",
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 20,
    marginBottom: 3,
  },
  appointmentText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  openMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  openMapsBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  customerAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  customerNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 1,
  },
  addressText: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },
  notesCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  notesBody: {
    fontSize: 11,
    color: "#92400E",
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 4,
  },
  skipBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 13,
    borderRadius: 14,
    ...Shadows.sm,
  },
  startTripBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 14,
    ...Shadows.md,
  },
  arriveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0284C7",
    paddingVertical: 13,
    borderRadius: 14,
    ...Shadows.md,
  },
  exitNavBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  exitNavBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  btnDisabled: {
    opacity: 0.6,
  },

  /* Full-Screen Work Order Update View (Light / Clean White Theme) */
  fsContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  fsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  fsHeaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  fsHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  fsHeaderSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  fsHeaderTimerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5.5,
    backgroundColor: "#FFFBEB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  fsHeaderTimerDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: "#D97706",
  },
  fsHeaderTimerDigits: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  fsHeaderBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fsHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "50%",
  },
  fsTypePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  fsTypePillStandard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  fsTypePillWarranty: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  fsTypeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  fsTypeTextStandard: {
    color: "#1D4ED8",
  },
  fsTypeTextWarranty: {
    color: "#047857",
  },
  fsStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFBEB",
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  fsStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D97706",
  },
  fsStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  fsScrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 170,
  },
  fsBottomCompleteBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 0,
    shadowColor: "transparent",
  },
  fsCompleteBtnReady: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    paddingVertical: 13,
    borderRadius: 10,
  },
  fsCompleteBtnReadyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  fsCompleteBtnPending: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  fsPendingLeft: {
    flex: 1,
    marginRight: 8,
  },
  fsPendingPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  fsPendingPillText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#DC2626",
  },
  fsPendingSubText: {
    fontSize: 11,
    color: "#64748B",
  },
  fsPendingRightBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  fsPendingRightBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  timerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FED7AA",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  timerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  timerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D97706",
  },
  timerHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.8,
  },
  timerDigits: {
    fontSize: 38,
    fontWeight: "900",
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
    marginVertical: 4,
    letterSpacing: 1.5,
  },
  timerSubText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  fsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fsBlankCanvas: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    marginTop: 8,
  },
  fsBlankTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 12,
    marginBottom: 4,
  },
  fsBlankSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
  },
});
