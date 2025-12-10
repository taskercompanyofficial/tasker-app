import { User } from "@/types/user";
import { Service } from "./service";

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  images?: string[];
  tags?: string[];
  status: "active" | "inactive" | "draft";
  created_at?: Date;
  updated_at?: Date;
  created_by?: User;
  updated_by?: User;
  services?: Service[];
};

export type CategoryResponse = Category & {
  id: number;
  created_by: User;
  updated_by: User;
  created_at: Date;
  updated_at: Date;
};
