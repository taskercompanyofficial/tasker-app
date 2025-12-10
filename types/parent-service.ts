import { User } from "./user";

export interface ParentService {
  id: number;
  name: string;
  description: string;
  image: string;
  images: string[];
  tags: string[];
  price: number;
  discount: number;
  discount_type: "percentage" | "fixed";
  discount_start_date: string;
  discount_end_date: string;
  notes: string;
  status: string;
  service_id: number;
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