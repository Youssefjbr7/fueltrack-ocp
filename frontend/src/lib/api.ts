const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fuel_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || error.message || 'Erreur inconnue');
  }

  return response.json();
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getProfile: () => request<any>('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  register: (data: any) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => request<any>('/utilisateurs'),
  updateUser: (id: number, data: any) =>
    request<any>(`/utilisateurs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request<any>(`/utilisateurs/${id}`, { method: 'DELETE' }),
};

// ---- Engins ----
export const enginsApi = {
  getAll: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)]))
    ).toString() : '';
    return request<any>(`/engins${query}`);
  },
  getById: (id: string) => request<any>(`/engins/${id}`),
  getStats: (id: string, periode?: number) =>
    request<any>(`/engins/${id}/stats${periode ? `?periode=${periode}` : ''}`),
  create: (data: any) =>
    request<any>('/engins', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/engins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/engins/${id}`, { method: 'DELETE' }),
};

// ---- Consommations ----
export const consommationsApi = {
  getAll: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)]))
    ).toString() : '';
    return request<any>(`/consommations${query}`);
  },
  getById: (id: string) => request<any>(`/consommations/${id}`),
  create: (data: any) =>
    request<any>('/consommations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/consommations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/consommations/${id}`, { method: 'DELETE' }),
};

// ---- Imports ----
export const importsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/imports${query}`);
  },
  getById: (id: string) => request<any>(`/imports/${id}`),
  delete: (id: string) =>
    request<any>(`/imports/${id}`, { method: 'DELETE' }),

  upload: async (file: File): Promise<any> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/imports/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur upload' }));
      throw new Error(error.error || 'Erreur lors de l\'upload');
    }

    return response.json();
  },
};

// ---- Dashboard ----
export const dashboardApi = {
  getStats: (periode?: number) =>
    request<any>(`/dashboard/stats${periode ? `?periode=${periode}` : ''}`),
  getAlerts: () => request<any>('/dashboard/alerts'),
};
