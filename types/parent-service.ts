import { User } from "./user";

export interface ParentService {
  id: number;
  slug?: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  tags: string[];
  includes?: string[];
  excludes?: string[];
  rating?: number;
  price: number;
  discount: number;
  discount_type: "percentage" | "fixed";
  discount_start_date?: string;
  discount_end_date?: string;
  notes?: string;
  status?: string;
  service_id: number;
  usage_count?: number;
  revenue?: number;
  last_used_at?: string;
  required_file_types?: Array<{
    id?: number;
    file_type_id?: number;
    is_required?: boolean;
    file_type?: {
      id?: number;
      name?: string;
      description?: string;
    };
  }>;
  created_by?: User;
  updated_by: User;
}

export interface ParentServiceTable extends ParentService {
  id: number;
  created_at: Date;
  updated_at: Date;
  created_by: User;
  updated_by: User;
}
