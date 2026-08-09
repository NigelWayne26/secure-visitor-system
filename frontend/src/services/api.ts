import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  AuthTokens,
  CheckInResponse,
  CreateEmployeeDTO,
  CreateVisitDTO,
  CreateVisitorDTO,
  DashboardSummaryResponse,
  Employee,
  PassVerificationResponse,
  ReportPeriod,
  Visit,
  Visitor,
  VisitorPass,
  VisitReportResponse,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokensStr = localStorage.getItem('auth_tokens');
    if (tokensStr) {
      try {
        const tokens: AuthTokens = JSON.parse(tokensStr);
        if (tokens.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }
      } catch (e) {
        console.error('Failed to parse auth tokens', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokensStr = localStorage.getItem('auth_tokens');

      if (tokensStr) {
        try {
          const tokens: AuthTokens = JSON.parse(tokensStr);
          const refreshResponse = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: tokens.refresh,
          });

          const newTokens: AuthTokens = {
            access: refreshResponse.data.access,
            refresh: tokens.refresh,
          };

          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('auth_tokens');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const parseApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data;
      if (typeof data === 'string') return data;
      if (data.detail) return data.detail;
      if (data.reason) return data.reason;

      const messages = Object.entries(data)
        .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
        .join(' | ');
      return messages || `Error ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      return 'Network Error: Backend server is unreachable (127.0.0.1:8000).';
    }
  }
  return 'An unexpected error occurred.';
};

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    axios.post<AuthTokens>(`${API_BASE_URL}/token/`, credentials),
};

export const visitorApi = {
  getVisitors: () => api.get<Visitor[]>('/visitors/'),
  getVisitor: (id: number) => api.get<Visitor>(`/visitors/${id}/`),
  createVisitor: (data: CreateVisitorDTO) => api.post<Visitor>('/visitors/', data),
  updateVisitor: (id: number, data: Partial<CreateVisitorDTO>) => api.patch<Visitor>(`/visitors/${id}/`, data),
  deleteVisitor: (id: number) => api.delete(`/visitors/${id}/`),
};

export const visitApi = {
  getVisits: () => api.get<Visit[]>('/visits/'),
  getVisit: (id: number) => api.get<Visit>(`/visits/${id}/`),
  getCurrentlyInside: () => api.get<Visit[]>('/visits/currently-inside/'),
  createVisit: (data: CreateVisitDTO) => api.post<Visit>('/visits/', data),
  updateVisit: (id: number, data: Partial<CreateVisitDTO>) => api.patch<Visit>(`/visits/${id}/`, data),
  checkOut: (visitId: number) => api.post<Visit>(`/visits/${visitId}/check-out/`),
};

export const employeeApi = {
  getEmployees: () => api.get<Employee[]>('/employees/'),
  getEmployee: (id: number) => api.get<Employee>(`/employees/${id}/`),
  createEmployee: (data: CreateEmployeeDTO) => api.post<Employee>('/employees/', data),
  updateEmployee: (id: number, data: Partial<CreateEmployeeDTO>) =>
    api.patch<Employee>(`/employees/${id}/`, data),
  deleteEmployee: (id: number) => api.delete(`/employees/${id}/`),
};

export const passApi = {
  generatePass: (visitId: number) => api.post<VisitorPass>(`/visits/${visitId}/generate-pass/`),

  getQrImageUrl: async (visitId: number): Promise<string> => {
    const tokensStr = localStorage.getItem('auth_tokens');
    let token = '';
    if (tokensStr) {
      const tokens: AuthTokens = JSON.parse(tokensStr);
      token = tokens.access;
    }

    const response = await fetch(`${API_BASE_URL}/visits/${visitId}/qr/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch QR image pass.');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  verifyPass: (token: string) => api.post<PassVerificationResponse>('/passes/verify/', { token }),
  checkInPass: (token: string) => api.post<CheckInResponse>('/passes/check-in/', { token }),
};


export const dashboardApi = {
  getSummary: () => api.get<DashboardSummaryResponse>('/dashboard/summary/'),
};

export const reportApi = {
  getVisitReport: (period: ReportPeriod = 'daily') =>
    api.get<VisitReportResponse>(`/reports/visits/`, { params: { period } }),
};