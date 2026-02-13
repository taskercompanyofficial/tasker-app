import { useState } from "react";
import type { CreateWorkOrderPayload, WorkOrderItemPayload, WorkOrderCreateResponse } from "@/services/work-orders";
import { createWorkOrder } from "@/services/work-orders";

export type CheckoutItem = {
  serviceId: number;
  serviceName: string;
  quantity: number;
  price: number;
  discount: number;
  discountType: "percentage" | "fixed";
};

type PaymentMethodId = "cash" | "card" | "wallet";

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatDateForApi(date: Date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}
function formatTimeForApi(date: Date) {
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${h}:${m}:${s}`;
}

export function useCheckout(items: CheckoutItem[]) {
  const [scheduledDate, setScheduledDate] = useState<Date>(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9 || hour >= 18) {
      now.setHours(9, 0, 0, 0);
    }
    return now;
  });
  const [scheduledTime, setScheduledTime] = useState<Date>(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9 || hour >= 18) {
      now.setHours(9, 0, 0, 0);
    }
    return now;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("cash");
  const [notes, setNotes] = useState<string>("");
  const [addressId, setAddressId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const submit = async (): Promise<{ ok: boolean; workOrderNumber?: string; message?: string }> => {
    if (!addressId) {
      return { ok: false, message: "Please select a service address to continue." };
    }
    const sd = formatDateForApi(scheduledDate);
    const st = formatTimeForApi(scheduledTime);
    const mappedItems: WorkOrderItemPayload[] = items.map((item) => ({
      parent_service_id: item.serviceId,
      quantity: item.quantity,
      unit_price: item.price,
      discount: item.discount,
      discount_type: item.discountType,
      scheduled_date: sd,
      scheduled_time: st,
    }));

    const payload: CreateWorkOrderPayload = {
      customer_address_id: addressId,
      items: mappedItems,
      payment_method: paymentMethod,
      notes,
    };

    setProcessing(true);
    try {
      const res: WorkOrderCreateResponse = await createWorkOrder(payload);
      if (res.status === "success") {
        const wno = res.work_order_number || res.data?.work_order_number || "";
        return { ok: true, workOrderNumber: wno };
      }
      return { ok: false, message: res.message || "Failed to create order." };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create order. Please try again.";
      return { ok: false, message: msg };
    } finally {
      setProcessing(false);
    }
  };

  return {
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    addressId,
    setAddressId,
    processing,
    submit,
  };
}

