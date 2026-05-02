// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  role: 'doctor' | 'receptionist' | 'admin';
  full_name: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updated: User) => void;
  isAuthenticated: boolean;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: number;
  patient_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  contact_number: string | null;
  address: string | null;
  guardian_name: string | null;
  allergies: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name?: string;
  visit_count?: number;
  is_deleted: number;
}

export interface PatientFormData {
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | '';
  contact_number: string;
  address: string;
  guardian_name: string;
  allergies: string;
  notes: string;
}

// ─── Visit ───────────────────────────────────────────────────────────────────

export interface Visit {
  id: number;
  patient_id: number;
  visit_date: string;
  chief_complaints: string | null;
  diagnosis: string | null;
  observations: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_name?: string;
  patient_name?: string;
  patient_uid?: string;
  prescription_count?: number;
  is_deleted: number;
}

export interface VisitFormData {
  visit_date: string;
  chief_complaints: string;
  diagnosis: string;
  observations: string;
  follow_up_date: string;
}

// ─── Prescription ─────────────────────────────────────────────────────────────

export interface PrescriptionItem {
  id?: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  special_instructions: string;
}

export interface Prescription {
  id: number;
  visit_id: number;
  patient_id: number;
  notes: string | null;
  investigations: string | null;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  patient_name?: string;
  patient_uid?: string;
  date_of_birth?: string | null;
  guardian_name?: string | null;
  gender?: string | null;
  contact_number?: string | null;
  allergies?: string | null;
  items: PrescriptionItem[];
  visit?: {
    visit_date: string;
    chief_complaints: string | null;
    diagnosis: string | null;
    follow_up_date: string | null;
  };
}

// ─── Medicine ─────────────────────────────────────────────────────────────────

export interface Medicine {
  id: number;
  name: string;
  description: string | null;
  dosage: string | null;
  created_at?: string;
}

export interface MedicineListResponse {
  medicines: Medicine[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatients: number;
  todayVisits: number;
  thisMonthVisits: number;
  totalVisits: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentPatients: Patient[];
  upcomingFollowups: Array<{
    follow_up_date: string;
    visit_id: number;
    patient_name: string;
    patient_uid: string;
    patient_id: number;
    contact_number: string | null;
  }>;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  patients: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
