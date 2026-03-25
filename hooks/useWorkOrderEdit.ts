import {
  VENDOR_UPDATE_WORK_ORDER_DETAILS_URL,
  VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL,
  VENDOR_WORK_ORDER_DETAILS_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { WorkOrder } from "@/types/work-order";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import useForm from "./use-form";

interface FormData {
  indoor_serial_number: string;
  outdoor_serial_number: string;
  product_indoor_model: string;
  product_outdoor_model: string;
  purchase_date: string;
  technician_remarks: string;
  service_concern_id: number | null;
  service_sub_concern_id: number | null;
  warranty_type_id: number | null;
}

interface UseWorkOrderEditReturn {
  // Data
  workOrder: WorkOrder | null;
  loading: boolean;
  refreshing: boolean;

  // Form hook
  form: ReturnType<typeof useForm<FormData>>;

  // Actions
  completing: boolean;
  autoSaving: boolean;
  onRefresh: () => void;
  handleSaveDetails: () => Promise<void>;
  handleCompleteWork: () => Promise<void>;

  // Modal states
  modalMessage: string;
  showSuccessModal: boolean;
  showErrorModal: boolean;
  setShowSuccessModal: (value: boolean) => void;
  setShowErrorModal: (value: boolean) => void;

  // Refresh work order
  refreshWorkOrder: () => Promise<void>;
}

export function useWorkOrderEdit(id: string): UseWorkOrderEditReturn {
  // Data states
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Modal states
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Form hook with initial values
  const form = useForm<FormData>({
    indoor_serial_number: "",
    outdoor_serial_number: "",
    product_indoor_model: "",
    product_outdoor_model: "",
    purchase_date: "",
    technician_remarks: "",
    service_concern_id: null,
    service_sub_concern_id: null,
    warranty_type_id: null,
  });

  const fetchWorkOrderDetails = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      const response = await axios.get(VENDOR_WORK_ORDER_DETAILS_URL(Number(id)));
      const data = response.data.data;
      setWorkOrder(data);

      // Populate form with existing data
      form.setData({
        indoor_serial_number: data.indoor_serial_number || "",
        outdoor_serial_number: data.outdoor_serial_number || "",
        product_indoor_model: data.product_indoor_model || "",
        product_outdoor_model: data.product_outdoor_model || "",
        purchase_date: data.purchase_date || "",
        technician_remarks: data.technician_remarks || "",
        service_concern_id: data.service_concern_id || null,
        service_sub_concern_id: data.service_sub_concern_id || null,
        warranty_type_id: data.warranty_type_id || null,
      });

      // Reset dirty state after initial load
      form.setDefaults({
        indoor_serial_number: data.indoor_serial_number || "",
        outdoor_serial_number: data.outdoor_serial_number || "",
        product_indoor_model: data.product_indoor_model || "",
        product_outdoor_model: data.product_outdoor_model || "",
        purchase_date: data.purchase_date || "",
        technician_remarks: data.technician_remarks || "",
        service_concern_id: data.service_concern_id || null,
        service_sub_concern_id: data.service_sub_concern_id || null,
        warranty_type_id: data.warranty_type_id || null,
      });

    } catch (error) {
      setModalMessage("Failed to load work order details");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, refreshing]);

  const handleSaveDetails = async (isAutoSave = false) => {
    if (isAutoSave) {
      setAutoSaving(true);
    }
    
    try {
      await axios.post(VENDOR_UPDATE_WORK_ORDER_DETAILS_URL(Number(id)), form.data);
      if (!isAutoSave) {
        setModalMessage("Details saved successfully");
        setShowSuccessModal(true);
      }
      // Sync defaults with current data to reset dirty state
      form.setDefaults(form.data);
    } catch (error: any) {
      if (!isAutoSave) {
        setModalMessage(error.response?.data?.message || "Failed to save details");
        setShowErrorModal(true);
      }
    } finally {
      if (isAutoSave) {
        setAutoSaving(false);
      }
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!form.isDirty || loading || refreshing || completing) return;

    const timer = setTimeout(() => {
      handleSaveDetails(true);
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [form.data, loading, refreshing, completing]);

  useEffect(() => {
    fetchWorkOrderDetails();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkOrderDetails();
  }, [fetchWorkOrderDetails]);

  const handleCompleteWork = async () => {
    try {
      setCompleting(true);
      // Ensure all details are saved before completing
      if (form.isDirty) {
        await handleSaveDetails(true);
      }
      
      await axios.post(VENDOR_UPDATE_WORK_ORDER_STATUS_BY_SLUG_URL(Number(id)), {
        status_slug: "completed",
        sub_status_slug: "pending-service-centre-complete",
      });
      setModalMessage("Work order completed successfully");
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push("/vendor/(tabs)/jobs");
      }, 1500);
    } catch (error: any) {
      setModalMessage(
        error.response?.data?.message || "Failed to complete work order"
      );
      setShowErrorModal(true);
    } finally {
      setCompleting(false);
    }
  };

  return {
    // Data
    workOrder,
    loading,
    refreshing,

    // Form
    form,

    // Actions
    completing,
    autoSaving,
    onRefresh,
    handleSaveDetails: () => handleSaveDetails(false),
    handleCompleteWork,

    // Modal states
    modalMessage,
    showSuccessModal,
    showErrorModal,
    setShowSuccessModal,
    setShowErrorModal,

    // Refresh
    refreshWorkOrder: fetchWorkOrderDetails,
  };
}
