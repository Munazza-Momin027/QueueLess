// API Service Client wrapper

// Read API URL from Vite environment variable (e.g., VITE_API_URL=https://api.queueless.com)
// In production on Vercel without a separate backend domain, defaults to relative '/api'
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const BASE_URL = !rawApiUrl
  ? '/api'
  : rawApiUrl.endsWith('/api')
    ? rawApiUrl
    : `${rawApiUrl}/api`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('queueless_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (payload: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  demoLogin: (role: string) => request<any>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),

  // Student Module APIs
  getStudentDashboard: () => request<any>('/student/dashboard'),
  studentJoinQueue: (payload: any) => request<any>('/student/queue/join', { method: 'POST', body: JSON.stringify(payload) }),
  getStudentActiveTokens: () => request<{ activeTokens: any[] }>('/student/queue/active'),
  cancelStudentToken: (id: number) => request<any>(`/student/queue/token/${id}/cancel`, { method: 'POST' }),
  getStudentHistory: () => request<{ history: any[] }>('/student/queue/history'),

  // Staff Module APIs
  getStaffDashboard: () => request<any>('/staff/dashboard'),
  getStaffQueue: (serviceId: number) => request<any>(`/staff/queue/${serviceId}`),
  staffCallNext: (serviceId: number, counterId: number) => request<any>('/staff/queue/call-next', { method: 'POST', body: JSON.stringify({ service_id: serviceId, counter_id: counterId }) }),
  staffUpdateStatus: (tokenId: number, status: string, counterId?: number) => request<any>(`/staff/queue/${tokenId}/status`, { method: 'POST', body: JSON.stringify({ status, counter_id: counterId }) }),
  staffRecall: (tokenId: number) => request<any>(`/staff/queue/${tokenId}/recall`, { method: 'POST' }),
  getStaffHistory: () => request<{ history: any[] }>('/staff/history'),
  getStaffStats: () => request<any>('/staff/stats'),

  // Admin Module APIs
  getAdminOverview: () => request<any>('/admin/overview'),
  getAdminUsers: (params?: any) => request<any>('/admin/users' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  adminCreateUser: (payload: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateUserRole: (id: number, role: string) => request<any>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  adminDeleteUser: (id: number) => request<any>(`/admin/users/${id}`, { method: 'DELETE' }),
  getAdminStudents: () => request<{ students: any[] }>('/admin/students'),
  getAdminStaff: () => request<{ staff: any[] }>('/admin/staff'),
  adminAssignStaffCounter: (staff_id: number, counter_id: number) => request<any>('/admin/staff/assign-counter', { method: 'POST', body: JSON.stringify({ staff_id, counter_id }) }),
  getAdminSettings: () => request<{ settings: any }>('/admin/settings'),
  updateAdminSettings: (settings: any) => request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),
  getAdminQueues: (serviceId: number) => request<any>(`/admin/queues/${serviceId}`),
  callNextToken: (serviceId: number, counterId: number) => request<any>('/admin/queues/call-next', { method: 'POST', body: JSON.stringify({ service_id: serviceId, counter_id: counterId }) }),
  updateTokenStatus: (tokenId: number, status: string, counterId?: number) => request<any>(`/admin/queues/${tokenId}/status`, { method: 'POST', body: JSON.stringify({ status, counter_id: counterId }) }),
  recallToken: (tokenId: number) => request<any>(`/admin/queues/${tokenId}/recall`, { method: 'POST' }),

  // Services
  getServices: () => request<{ services: any[] }>('/services'),
  getService: (id: number) => request<{ service: any }>(`/services/${id}`),
  createService: (payload: any) => request<any>('/services', { method: 'POST', body: JSON.stringify(payload) }),
  updateService: (id: number, payload: any) => request<any>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  addCounter: (serviceId: number, payload: any) => request<any>(`/services/${serviceId}/counters`, { method: 'POST', body: JSON.stringify(payload) }),
  toggleCounter: (counterId: number, isActive: boolean) => request<any>(`/services/counters/${counterId}`, { method: 'PUT', body: JSON.stringify({ is_active: isActive ? 1 : 0 }) }),

  // General Queues (Backward compatibility & Public Token Tracking)
  getPublicDisplay: () => request<any>('/queues/display'),
  joinQueue: (payload: any) => request<any>('/queues/join', { method: 'POST', body: JSON.stringify(payload) }),
  getMyActiveTokens: () => request<{ activeTokens: any[] }>('/queues/my-active'),
  getTokenDetails: (id: number) => request<{ token: any }>(`/queues/token/${id}`),
  cancelToken: (id: number) => request<any>(`/queues/token/${id}/cancel`, { method: 'POST' }),
  getQueueHistory: () => request<{ history: any[] }>('/queues/history'),

  // Appointments
  getSlots: (serviceId: number, date: string) => request<any>(`/appointments/slots?service_id=${serviceId}&date=${date}`),
  bookAppointment: (payload: any) => request<any>('/appointments/book', { method: 'POST', body: JSON.stringify(payload) }),
  getMyAppointments: () => request<{ appointments: any[] }>('/appointments/my'),
  cancelAppointment: (id: number) => request<any>(`/appointments/${id}/cancel`, { method: 'POST' }),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),
  clearReadNotifications: () => request<any>('/notifications/clear', { method: 'DELETE' }),

  // Feedback & Analytics
  submitFeedback: (payload: any) => request<any>('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  getFeedbackSummary: () => request<any>('/feedback/summary'),
  getAnalytics: () => request<any>('/analytics/overview')
};
