export type UserRole = 'admin' | 'receptionist' | 'employee' | 'security_officer' | string;

export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Visitor {
  id: number;
  full_name: string;
  id_number: string;
  phone: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  email: string;
  phone?: string;
  user?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeDTO {
  full_name: string;
  department?: string;
  position?: string;
  email: string;
  phone?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'visitors'
  | 'employees'
  | 'visits'
  | 'verify'
  | 'currently_inside'
  | 'reports';

export type VisitStatus = 'scheduled' | 'checked_in' | 'checked_out' | 'expired' | 'cancelled';

export interface Visit {
  id: number;
  visitor: number;
  host_employee: number;
  visitor_detail: Visitor;
  host_employee_detail: Employee;
  purpose: string;
  expected_date: string;
  expected_time: string;
  status: VisitStatus;
  has_pass?: boolean;
  check_in_time?: string | null;
  check_out_time?: string | null;
  created_at?: string;
}

export interface CreateVisitorDTO {
  full_name: string;
  id_number: string;
  phone: string;
  email: string;
}

export interface CreateVisitDTO {
  visitor: number;
  host_employee: number;
  purpose: string;
  expected_date: string; // YYYY-MM-DD
  expected_time: string; // HH:MM or HH:MM:SS
  is_group_visit?: boolean;
}

export interface VisitorPass {
  id: number;
  visit: number;
  token: string;
  expires_at: string;
  is_used: boolean;
  visit_detail?: Visit;
}

export interface PassVerificationSuccess {
  valid: true;
  pass: VisitorPass;
}

export interface PassVerificationFailure {
  valid: false;
  reason: string;
}

export type PassVerificationResponse = PassVerificationSuccess | PassVerificationFailure;

export interface CheckInSuccess {
  success: true;
  visit: Visit;
}

export interface CheckInFailure {
  valid: false;
  reason: string;
}

export type CheckInResponse = CheckInSuccess | CheckInFailure;

export interface AdminDashboardSummary {
  total_visitors: number;
  todays_visits: number;
  active_visitors: number;
  completed_visits: number;
}

export interface ReceptionistDashboardSummary {
  todays_visits: Visit[];
  recent_visitors: Visitor[];
  active_visits_count: number;
}

export interface SecurityOfficerDashboardSummary {
  currently_inside_count: number;
  todays_checkins_count: number;
  todays_checkouts_count: number;
  pending_verification_count: number;
}

export interface EmployeeDashboardSummary {
  profile: Employee | null;
  their_visitors: Visit[];
  detail?: string;
}

export type DashboardSummaryResponse =
  | AdminDashboardSummary
  | ReceptionistDashboardSummary
  | SecurityOfficerDashboardSummary
  | EmployeeDashboardSummary;

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface VisitReportResponse {
  period: ReportPeriod;
  start_date: string;
  end_date: string;
  total_visits: number;
  scheduled: number;
  checked_in: number;
  checked_out: number;
  cancelled: number;
  visits: Visit[];
}
