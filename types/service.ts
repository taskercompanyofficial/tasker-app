import { Category } from "./category";
import { ParentService } from "./parent-service";
import { User } from "./user";

export type Service = {
  name: string;
  slug: string;
  description: string;
  image: string;
  images: string[];
  tags: string[];
  notes: string;
  status: string;
  category_id: number;
  parent_services: ParentService[];
};

export type ServiceTable = {
  id: number;
  name: string;
  slug: string;
  description: string;
  images: string[];
  tags: string[];
  notes: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  created_by: User;
  updated_by: User;
  category: Category;
};
