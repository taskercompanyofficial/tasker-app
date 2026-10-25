import { Category } from "./category";
import { User } from "./user";

export type MainCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  images?: string[];
  tags?: string[];
  status: "active" | "inactive" | "draft" | "comming-soon";
  created_at?: Date | string;
  updated_at?: Date | string;
  rating?: number;
  reviews_count?: number;
  positive_percentage?: number;
  created_by?: User;
  updated_by?: User;
  categories?: Category[];
};

export type MainCategoryResponse = MainCategory & {
  created_by?: User;
  updated_by?: User;
};
