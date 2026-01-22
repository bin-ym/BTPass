// Database types matching Supabase schema

export type UserRole = "ADMIN" | "USHER";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  qr_token: string;
  group_size: number;
  checked_in_count: number;
  status: "ACTIVE" | "USED" | "REVOKED";
  created_at: string;
}
