export interface Order {
  id: number;
  customer_id: number;
  customer_address_id: number;
  order_number: string;
  order_date: string;
  notes: string | null;
  extra_number?: string | null;
  reminders?: string | null;
  attachments?: string[] | null;
  payment_method: "cash" | "card" | "wallet" | "online" | string;
  payment_status: "pending" | "paid" | "partially_paid" | "refunded" | "failed" | string;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  tax_amount: number;
  status:
    | "pending"
    | "confirmed"
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "refunded";
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  address?: any;
  assigned_vendor_id?: number | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  parent_service_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  discount_type: "percentage" | "fixed";
  subtotal: number;
  scheduled_date: string;
  scheduled_time: string;
  status:
    | "pending"
    | "scheduled"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "rescheduled";
  assigned_technician_id: number | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  completion_images: string[] | null;
  rating: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  parentService?: {
    id: number;
    name: string;
    description: string;
    image: string;
  };
}
