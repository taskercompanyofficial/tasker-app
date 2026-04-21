import {
  VENDOR_ACCEPT_WORK_ORDER_URL,
  VENDOR_ASSIGN_STAFF_URL,
  VENDOR_CANCEL_WORK_ORDER_URL,
  VENDOR_REJECT_WORK_ORDER_URL,
  VENDOR_SCHEDULE_WORK_ORDER_URL,
  VENDOR_STAFF_URL,
  VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL,
  VENDOR_WORK_ORDER_DETAILS_URL,
  VENDOR_STAFF_WORK_ORDER_DETAILS_URL,
  VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { useAuthStore } from "@/context/auth-store";
import { WorkOrder } from "@/types/work-order";
import { VendorStaff } from "@/types/user";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";

interface PendingStatusUpdate {
  statusSlug: string;
  subStatusSlug: string;
  statusName: string;
}

interface UseWorkOrderReturn {
  // Data
  workOrder: WorkOrder | null;
  loading: boolean;
  refreshing: boolean;
  approvedStaff: VendorStaff[];

  // Processing states
  accepting: boolean;
  rejecting: boolean;
  updatingStatus: boolean;
  
  // Computed values
  isPendingAcceptance: boolean;
  isAccepted: boolean;
  currentStatusSlug: string | undefined;
  currentSubStatusSlug: string | undefined;
  
  // Modal states
  pendingStatusUpdate: PendingStatusUpdate | null;
  modalMessage: string;
  showSuccessModal: boolean;
  showErrorModal: boolean;
  
  // Actions
  onRefresh: () => void;
  handleAccept: () => Promise<void>;
  handleReject: (reason: string) => Promise<void>;
  handleCancel: (reason: string) => Promise<void>;
  handleSchedule: (date: string, time: string, remarks: string) => Promise<void>;
  handleAssignStaff: (staffId: number) => Promise<void>;
  handleUpdateStatus: (remarks: string) => Promise<void>;
  showStatusUpdateModal: (statusSlug: string, subStatusSlug: string, statusName: string) => void;
  clearStatusUpdate: () => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowErrorModal: (show: boolean) => void;
}

export function useWorkOrder(id: string): UseWorkOrderReturn {
  const appMode = useAuthStore((state) => state.appMode);
  const isVendorStaff = appMode === "vendor_staff";

  // Data states
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvedStaff, setApprovedStaff] = useState<VendorStaff[]>([]);
  
  // Processing states
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Modal states
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<PendingStatusUpdate | null>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Computed values
  const isPendingAcceptance = workOrder?.accepted_at === null && workOrder?.rejected_at === null && workOrder?.cancelled_at === null;
  const isAccepted = workOrder?.accepted_at !== null && workOrder?.completed_at === null && workOrder?.cancelled_at === null;
  const currentStatusSlug = workOrder?.status?.slug;
  const currentSubStatusSlug = workOrder?.sub_status?.slug;

  // Fetch work order details — use correct endpoint per role
  const fetchWorkOrderDetails = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const url = isVendorStaff
        ? VENDOR_STAFF_WORK_ORDER_DETAILS_URL(Number(id))
        : VENDOR_WORK_ORDER_DETAILS_URL(Number(id));
      const response = await axios.get(url);
      setWorkOrder(response.data.data);
    } catch (error) {
      setModalMessage("Failed to load job details");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, refreshing, isVendorStaff]);

  const fetchApprovedStaff = useCallback(async () => {
    // Vendor-staff cannot manage staff — skip this fetch entirely
    if (isVendorStaff) return;
    try {
      const response = await axios.get(VENDOR_STAFF_URL);
      const approved = response.data.data.filter((s: VendorStaff) => s.status === "approved");
      setApprovedStaff(approved);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    }
  }, [isVendorStaff]);

  useEffect(() => {
    if (id) {
      fetchWorkOrderDetails();
      fetchApprovedStaff();
    }
  }, [id, fetchWorkOrderDetails, fetchApprovedStaff]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkOrderDetails();
  }, [fetchWorkOrderDetails]);

  // Accept work order
  const handleAccept = useCallback(async () => {
    try {
      setAccepting(true);
      await axios.post(VENDOR_ACCEPT_WORK_ORDER_URL(Number(id)));
      setModalMessage("Job accepted successfully");
      setShowSuccessModal(true);
      fetchWorkOrderDetails();
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || "Failed to accept job");
      setShowErrorModal(true);
    } finally {
      setAccepting(false);
    }
  }, [id, fetchWorkOrderDetails]);

  // Reject work order
  const handleReject = useCallback(async (reason: string) => {
    if (!reason.trim()) {
      setModalMessage("Please provide a reason for rejection");
      setShowErrorModal(true);
      return;
    }

    try {
      setRejecting(true);
      await axios.post(VENDOR_REJECT_WORK_ORDER_URL(Number(id)), { reason });
      setModalMessage("Job rejected");
      setShowSuccessModal(true);
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || "Failed to reject job");
      setShowErrorModal(true);
    } finally {
      setRejecting(false);
    }
  }, [id]);

  // Cancel work order
  const handleCancel = useCallback(async (reason: string) => {
    if (!reason.trim()) {
      setModalMessage("Please provide a reason for cancellation");
      setShowErrorModal(true);
      return;
    }

    try {
      setRejecting(true);
      await axios.post(VENDOR_CANCEL_WORK_ORDER_URL(Number(id)), { reason });
      setModalMessage("Job cancelled");
      setShowSuccessModal(true);
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || "Failed to cancel job");
      setShowErrorModal(true);
    } finally {
      setRejecting(false);
    }
  }, [id]);

  // Schedule work order
  const handleSchedule = useCallback(async (date: string, time: string, remarks: string) => {
    try {
      setUpdatingStatus(true);
      await axios.post(VENDOR_SCHEDULE_WORK_ORDER_URL(Number(id)), {
        scheduled_date: date,
        scheduled_time: time,
        remarks,
      });
      setModalMessage("Job scheduled successfully");
      setShowSuccessModal(true);
      fetchWorkOrderDetails();
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || "Failed to schedule job");
      setShowErrorModal(true);
    } finally {
      setUpdatingStatus(false);
    }
  }, [id, fetchWorkOrderDetails]);
  
  // Assign staff to work order
  const handleAssignStaff = useCallback(async (staffId: number) => {
    try {
      setUpdatingStatus(true);
      await axios.post(VENDOR_ASSIGN_STAFF_URL(Number(id)), {
        vendor_staff_id: staffId,
      });
      setModalMessage("Staff assigned successfully");
      setShowSuccessModal(true);
      fetchWorkOrderDetails();
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || "Failed to assign staff");
      setShowErrorModal(true);
    } finally {
      setUpdatingStatus(false);
    }
  }, [id, fetchWorkOrderDetails]);

  // Get current location helper
  const getCurrentLocation = async () => {
    let locationData: { latitude?: number; longitude?: number; address?: string } = {};
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        locationData.latitude = location.coords.latitude;
        locationData.longitude = location.coords.longitude;

        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (address) {
            locationData.address = [
              address.name, address.street, address.district,
              address.city, address.region, address.country,
            ].filter(Boolean).join(", ");
          }
        } catch (geocodeError) {
          // Geocoding failed
        }
      }
    } catch (locationError) {
      // Location permission denied or error
    }
    
    return locationData;
  };

  // Update status
  const handleUpdateStatus = useCallback(async (remarks: string) => {
    if (!pendingStatusUpdate) return;

    try {
      setUpdatingStatus(true);
      const locationData = await getCurrentLocation();

      const statusUrl = isVendorStaff
        ? VENDOR_STAFF_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(id))
        : VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(id));
      await axios.post(statusUrl, {
        status_slug: pendingStatusUpdate.statusSlug,
        sub_status_slug: pendingStatusUpdate.subStatusSlug,
        remarks,
        ...locationData,
      });

      setModalMessage(`Status updated to ${pendingStatusUpdate.statusName}`);
      setShowSuccessModal(true);
      fetchWorkOrderDetails();
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || "Failed to update status");
      setShowErrorModal(true);
    } finally {
      setUpdatingStatus(false);
      setPendingStatusUpdate(null);
    }
  }, [id, pendingStatusUpdate, fetchWorkOrderDetails]);

  const showStatusUpdateModal = useCallback((statusSlug: string, subStatusSlug: string, statusName: string) => {
    setPendingStatusUpdate({ statusSlug, subStatusSlug, statusName });
  }, []);

  const clearStatusUpdate = useCallback(() => {
    setPendingStatusUpdate(null);
  }, []);

  return {
    workOrder,
    loading,
    refreshing,
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
    onRefresh,
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
  };
}
