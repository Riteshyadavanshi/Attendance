import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();
  if (!response.ok) {
    const message = json?.error?.message || json?.detail || 'Request failed';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return json.data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{
      access_token: string;
      refresh_token: string;
      user: {
        id: string;
        email: string;
        roles: string[];
        organization_id: string;
        employee_id: string | null;
        full_name: string | null;
      };
    }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
};

export const attendanceApi = {
  today: () => apiRequest<Record<string, unknown>>('/attendance/today'),
  checkIn: (payload: {
    face_image: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    device_info?: Record<string, string>;
  }) => apiRequest<Record<string, unknown>>('/attendance/check-in', { method: 'POST', body: payload }),
  checkOut: (payload: {
    face_image: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) => apiRequest<Record<string, unknown>>('/attendance/check-out', { method: 'POST', body: payload }),
  dashboard: () => apiRequest<Record<string, unknown>>('/attendance/dashboard'),
  lateToday: () =>
    apiRequest<{
      date: string;
      late_after_time: string;
      total_late: number;
      items: LateTodayEntry[];
    }>('/attendance/late-today'),
  lateLeaderboard: () =>
    apiRequest<{
      scope: string;
      total_late_days: number;
      total_employees: number;
      items: LateLeaderboardEntry[];
    }>('/attendance/late-leaderboard'),
  history: async () => {
    const data = await apiRequest<Record<string, unknown>[] | null>('/attendance/history');
    return Array.isArray(data) ? data : [];
  },
};

export const faceApi = {
  status: () =>
    apiRequest<{ face_enrolled: boolean; version: number; enrolled_at: string | null }>('/face/status'),
  enroll: (images: {
    front: string;
    left: string;
    right: string;
    up: string;
    down: string;
  }) => apiRequest<{ face_enrolled: boolean; version: number }>('/face/enroll', { method: 'POST', body: images }),
};

export type OfficeLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
};

export type EmployeeRecord = {
  id: string;
  employee_code: string;
  full_name: string;
  designation: string | null;
  mobile: string | null;
  department_id: string | null;
  face_enrolled: boolean;
  is_active: boolean;
  email: string | null;
};

export type EmployeePage = {
  items: EmployeeRecord[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
};

export const employeesApi = {
  list: async (page = 1, limit = 20): Promise<EmployeePage> => {
    const data = await apiRequest<EmployeePage | EmployeeRecord[]>(
      `/employees?page=${page}&limit=${limit}`,
    );
    if (Array.isArray(data)) {
      return {
        items: data,
        page: 1,
        limit: data.length,
        total: data.length,
        has_more: false,
      };
    }
    return {
      page: data?.page ?? page,
      limit: data?.limit ?? limit,
      total: data?.total ?? 0,
      has_more: data?.has_more ?? false,
      items: data?.items ?? [],
    };
  },
  create: (payload: {
    email: string;
    password: string;
    employee_code: string;
    full_name: string;
    designation?: string;
    mobile?: string;
    roles?: string[];
  }) => apiRequest<EmployeeRecord>('/employees', { method: 'POST', body: payload }),
};

export type LateTodayEntry = {
  rank: number;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string | null;
  check_in_at: string | null;
  minutes_late: number;
};

export type LateLeaderboardEntry = {
  rank: number;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string | null;
  late_days: number;
  total_minutes_late: number;
  last_late_at: string | null;
};

export type AttendanceRules = {
  work_start_time: string;
  work_end_time: string;
  late_threshold_minutes: number;
  half_day_threshold_hours: number;
  standard_hours: number;
  working_days: number[];
  timezone?: string;
  late_after_time?: string;
  check_in_opens_at?: string;
  check_in_early_buffer_minutes?: number;
};

export const attendanceRulesApi = {
  get: () => apiRequest<AttendanceRules>('/attendance-rules'),
  update: (payload: {
    work_start_time: string;
    work_end_time: string;
    late_threshold_minutes: number;
    half_day_threshold_hours?: number;
    standard_hours: number;
    working_days?: number[];
  }) => apiRequest<AttendanceRules>('/attendance-rules', { method: 'PUT', body: payload }),
};

export const officeLocationApi = {
  list: () => apiRequest<OfficeLocation[]>('/office-locations'),
  create: (payload: {
    name: string;
    latitude: number;
    longitude: number;
    radius_meters?: number;
  }) => apiRequest<OfficeLocation>('/office-locations', { method: 'POST', body: payload }),
  update: (id: string, payload: Partial<OfficeLocation>) =>
    apiRequest<OfficeLocation>(`/office-locations/${id}`, { method: 'PATCH', body: payload }),
};

export type FeedbackQuestion = {
  id: string;
  type: 'rating' | 'text' | 'choice';
  label: string;
  required: boolean;
  options?: string[];
};

export type FeedbackFormRecord = {
  id: string;
  title: string;
  description: string | null;
  questions: FeedbackQuestion[];
  is_active: boolean;
  response_count: number;
  created_at: string | null;
  already_submitted?: boolean;
};

export type FeedbackFormPage = {
  items: FeedbackFormRecord[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
};

export type FeedbackQuestionStat = {
  id: string;
  label: string;
  type: string;
  response_count: number;
  average?: number | null;
  distribution?: Record<string, number>;
  option_counts?: Record<string, number>;
  recent_texts?: string[];
};

export type FeedbackFormDashboard = {
  form_id: string;
  title: string;
  total_responses: number;
  questions: FeedbackQuestionStat[];
};

export type FeedbackSubmission = {
  id: string;
  employee_name: string | null;
  employee_code: string | null;
  answers: Record<string, string | number>;
  submitted_at: string | null;
};

export const feedbackFormsApi = {
  listHr: async (page = 1, limit = 20): Promise<FeedbackFormPage> => {
    const data = await apiRequest<FeedbackFormPage>(`/feedback-forms?page=${page}&limit=${limit}`);
    return { ...data, items: data?.items ?? [] };
  },
  listActive: () => apiRequest<FeedbackFormRecord[]>('/feedback-forms'),
  get: (id: string) => apiRequest<FeedbackFormRecord>(`/feedback-forms/${id}`),
  create: (payload: { title: string; description?: string; questions: FeedbackQuestion[] }) =>
    apiRequest<FeedbackFormRecord>('/feedback-forms', { method: 'POST', body: payload }),
  update: (
    id: string,
    payload: {
      title?: string;
      description?: string | null;
      questions?: FeedbackQuestion[];
      is_active?: boolean;
    },
  ) => apiRequest<FeedbackFormRecord>(`/feedback-forms/${id}`, { method: 'PATCH', body: payload }),
  remove: (id: string) =>
    apiRequest<void>(`/feedback-forms/${id}`, { method: 'DELETE' }),
  dashboard: (id: string) => apiRequest<FeedbackFormDashboard>(`/feedback-forms/${id}/dashboard`),
  responses: async (id: string, page = 1, limit = 20) => {
    const data = await apiRequest<{
      items: FeedbackSubmission[];
      page: number;
      limit: number;
      total: number;
      has_more: boolean;
    }>(`/feedback-forms/${id}/responses?page=${page}&limit=${limit}`);
    return { ...data, items: data?.items ?? [] };
  },
  submit: (id: string, answers: Record<string, string | number>) =>
    apiRequest<void>(`/feedback-forms/${id}/submit`, { method: 'POST', body: { answers } }),
  popupPending: () => apiRequest<FeedbackFormRecord[]>('/feedback-forms/popup-pending'),
  dismissPopup: (id: string) =>
    apiRequest<void>(`/feedback-forms/${id}/dismiss-popup`, { method: 'POST' }),
};
