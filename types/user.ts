export type User = {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  role: string;
  avatar_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_type?: 'vendor' | 'vendor_staff' | 'customer';
  vendor_id?: number;
  // Vendor specific fields
  cnic?: string;
  dob?: string;
  experience?: string;
  handled_categories?: string | string[];
  profile_image?: string;
  cnic_front_image?: string;
  cnic_back_image?: string;
  vendor?: {
    id: number;
    name: string;
    company_name?: string;
    phone?: string;
  };
};
