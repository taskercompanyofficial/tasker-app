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
  payment_method?: "cash" | "card" | "wallet" | "online" | string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  reminders?: string;
  attachments?: Array<{ uri: string; name?: string; type?: string } | string>;
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
  const hasFileAttachments =
    Array.isArray(payload.attachments) &&
    payload.attachments.some(
      (a) => typeof a === "object" && a !== null && "uri" in a
    );

  if (hasFileAttachments) {
    const formData = new FormData();
    formData.append("customer_address_id", String(payload.customer_address_id));
    if (payload.customer_name) formData.append("customer_name", payload.customer_name);
    if (payload.customer_phone) formData.append("customer_phone", payload.customer_phone);
    if (payload.payment_method) formData.append("payment_method", payload.payment_method);
    if (payload.notes) formData.append("notes", payload.notes);
    if (payload.reminders) formData.append("reminders", payload.reminders);

    payload.items.forEach((item, index) => {
      formData.append(`items[${index}][parent_service_id]`, String(item.parent_service_id));
      formData.append(`items[${index}][quantity]`, String(item.quantity));
      formData.append(`items[${index}][unit_price]`, String(item.unit_price));
      if (item.discount !== undefined) formData.append(`items[${index}][discount]`, String(item.discount));
      if (item.discount_type) formData.append(`items[${index}][discount_type]`, item.discount_type);
      if (item.scheduled_date) formData.append(`items[${index}][scheduled_date]`, item.scheduled_date);
      if (item.scheduled_time) formData.append(`items[${index}][scheduled_time]`, item.scheduled_time);
    });

    payload.attachments?.forEach((att, index) => {
      if (typeof att === "object" && att !== null && "uri" in att) {
        const filename = att.name || `attachment_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = att.type || (match ? `image/${match[1]}` : "image/jpeg");
        formData.append(`attachments[${index}]`, {
          uri: att.uri,
          name: filename,
          type,
        } as any);
      }
    });

    const res = await myAxios.post(WORK_ORDER_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as WorkOrderCreateResponse;
  }

  const res = await myAxios.post(WORK_ORDER_URL, payload);
  return res.data as WorkOrderCreateResponse;
}
