import myAxios from "@/lib/axios.config";
import { WORK_ORDER_URL } from "@/lib/api-endpoints";

export type WorkOrderItemPayload = {
  parent_service_id: number;
  quantity: number;
  unit_price: number;
  discount?: number;
  discount_type?: "percentage" | "fixed";
  scheduled_date?: string;
  scheduled_time?: string;
};

export type CreateWorkOrderPayload = {
  customer_address_id: number;
  items: WorkOrderItemPayload[];
  payment_method?: "cash" | "card" | "wallet";
  notes?: string;
};

export type WorkOrderCreateResponse = {
  status: "success" | "error";
  message?: string;
  work_order_number?: string;
  data?: {
    work_order_number?: string;
  };
};

export async function createWorkOrder(
  payload: CreateWorkOrderPayload
): Promise<WorkOrderCreateResponse> {
  const res = await myAxios.post(WORK_ORDER_URL, payload);
  return res.data as WorkOrderCreateResponse;
}

