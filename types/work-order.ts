import { FileType } from "./file-type";

export interface ServiceRequiredFile {
  id: number;
  parent_service_id: number;
  file_type_id: number;
  is_required: boolean;
  file_type: FileType;
}

export interface WorkOrderStatus {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

export interface WorkOrderCustomer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  whatsapp?: string;
}

export interface WorkOrderAddress {
  id: number;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
}

export interface WorkOrderFile {
  id: number;
  file_name: string;
  file_path: string;
  file_type: FileType;
  mime_type: string;
  notes?: string;
  uploaded_at: string;
  uploaded_by?: number;
}

export interface WorkOrder {
  id: number;
  work_order_number: string;

  // Status
  status: WorkOrderStatus;
  sub_status?: WorkOrderStatus;
  priority: "low" | "medium" | "high" | "urgent";

  // Customer
  customer: WorkOrderCustomer;
  address: WorkOrderAddress;
  brand_complaint_no?: string;
  reminders?: string;
  notes?: string;
  reference?: string;
  extra_number?: string;

  // Product Details (Editable)
  brand?: { id: number; name: string };
  category?: { id: number; name: string };
  service?: { id: number; name: string };
  parent_service?: {
    id: number;
    name: string;
    required_file_types?: ServiceRequiredFile[];
  };
  product?: { id: number; name: string; image?: string };

  // Service Concerns
  service_concern?: { id: number; name: string };
  service_sub_concern?: { id: number; name: string };

  // Warranty
  warranty_type?: { id: number; name: string };
  warrentyStatus?: string;

  product_indoor_model?: string;
  indoor_serial_number?: string;
  product_outdoor_model?: string;
  outdoor_serial_number?: string;
  purchase_date?: string;
  warranty_serial_number?: string;
  is_warranty_case?: boolean;

  // Descriptions
  customer_description?: string;
  defect_description?: string;
  technician_remarks?: string;
  service_description?: string;

  // Assignment
  assigned_to?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  vendor_staff?: {
    id: number;
    name: string;
    phone: string;
  };
  assigned_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  completed_at?: string;
  cancelled_at?: string;

  // Dates
  appointment_date?: string;
  appointment_time?: string;
  service_start_date?: string;
  service_start_time?: string;
  service_end_date?: string;
  service_end_time?: string;

  // Files
  files?: WorkOrderFile[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface WorkOrderListItem {
  id: number;
  work_order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  status: string;
  status_color?: string;
  priority: "low" | "medium" | "high" | "urgent";
  service_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  assigned_at?: string;
  is_pending_acceptance?: boolean;
}
