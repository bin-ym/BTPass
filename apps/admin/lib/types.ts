// Database types matching Supabase schema

export type UserRole = "ADMIN" | "USHER";

export type InvitationStatus = "ACTIVE" | "USED" | "REVOKED";

export type ScanResult = "ADMIT" | "REJECT";

export type ScanMode = "ONLINE" | "OFFLINE";

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
  status: InvitationStatus;
  created_at: string;
}

export interface ScanLog {
  id: string;
  invitation_id: string | null;
  usher_id: string | null;
  scanned_at: string;
  admit_count: number | null;
  result: ScanResult | null;
  mode: ScanMode | null;
  synced: boolean;
}

// Extended types with joined data for display
export interface ScanLogWithDetails extends ScanLog {
  invitation: Invitation | null;
  usher: User | null;
}

// Dashboard statistics
export interface DashboardStats {
  totalInvitations: number;
  totalScans: number;
  pendingInvitations: number;
  activeUshers: number;
  totalGuestsExpected: number;
  totalGuestsAdmitted: number;
}

// CSV upload types
export interface CSVRow {
  name: string;
  phone?: string;
  groupSize?: number;
}

export interface UploadResult {
  success: boolean;
  total: number;
  imported: number;
  errors: string[];
}

// Form types
export interface CreateUsherForm {
  name: string;
  email: string;
  phone?: string;
  pin: string;
}

export interface UpdateUsherForm {
  name: string;
  email: string;
  phone?: string;
  active: boolean;
}

export interface CreateInvitationForm {
  guest_name: string;
  guest_phone?: string;
  group_size: number;
}
