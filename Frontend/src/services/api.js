const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, '')
export const SOCKET_BASE_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/v1$/, '')).replace(/\/+$/, '')

export async function apiRequest(path, { body, method = 'GET', token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed')
    error.details = data?.details
    throw error
  }

  return data
}

export const authApi = {
  appeal: (body) => apiRequest('/auth/appeal', { method: 'POST', body }),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body }),
  register: (body) => apiRequest('/auth/register', { method: 'POST', body }),
}

export const employeeApi = {
  list: (token) => apiRequest('/employees', { token }),
  get: (token, id) => apiRequest(`/employees/${id}`, { token }),
  create: (token, body) => apiRequest('/employees', { method: 'POST', token, body }),
  update: (token, id, body) => apiRequest(`/employees/${id}`, { method: 'PATCH', token, body }),
  remove: (token, id) => apiRequest(`/employees/${id}`, { method: 'DELETE', token }),
  setLoginEnabled: (token, id, enabled) => apiRequest(`/employees/${id}/login`, { method: 'PATCH', token, body: { enabled } }),
  resetPassword: (token, id, password) => apiRequest(`/employees/${id}/reset-password`, { method: 'POST', token, body: { password } }),
}

export const payrollApi = {
  list: (token, query = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, value)
    })
    const search = params.toString()
    return apiRequest(`/payroll${search ? `?${search}` : ''}`, { token })
  },
  mine: (token) => apiRequest('/payroll/me', { token }),
  generate: (token, body) => apiRequest('/payroll/generate', { method: 'POST', token, body }),
  updateStatus: (token, id, status) => apiRequest(`/payroll/${id}/status`, { method: 'PATCH', token, body: { status } }),
}

export const companyApi = {
  list: (token) => apiRequest('/companies', { token }),
  get: (token, id) => apiRequest(`/companies/${id}`, { token }),
  suspend: (token, id, reason) => apiRequest(`/companies/${id}/suspend`, { method: 'PATCH', token, body: { reason } }),
  reactivate: (token, id) => apiRequest(`/companies/${id}/reactivate`, { method: 'PATCH', token }),
  disableAdmins: (token, id) => apiRequest(`/companies/${id}/disable-admins`, { method: 'PATCH', token }),
  enableAdmins: (token, id) => apiRequest(`/companies/${id}/enable-admins`, { method: 'PATCH', token }),
  softDelete: (token, id, reason) => apiRequest(`/companies/${id}/soft-delete`, { method: 'PATCH', token, body: { reason } }),
}

export const dashboardApi = {
  overview: (token) => apiRequest('/dashboard', { token }),
}

export const hrApi = {
  overview: (token) => apiRequest('/hr', { token }),
  createPosition: (token, body) => apiRequest('/hr/positions', { method: 'POST', token, body }),
}

export const leaveApi = {
  mine: (token) => apiRequest('/leave/me', { token }),
  create: (token, body) => apiRequest('/leave', { method: 'POST', token, body }),
  list: (token, status) => apiRequest(`/leave${status ? `?status=${status}` : ''}`, { token }),
  review: (token, id, body) => apiRequest(`/leave/${id}/review`, { method: 'PATCH', token, body }),
}

export const attendanceApi = {
  daily: (token) => apiRequest('/attendance/daily', { token }),
  history: (token, employeeId, query = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, value)
    })
    const search = params.toString()
    return apiRequest(`/attendance/employees/${employeeId}/history${search ? `?${search}` : ''}`, { token })
  },
  clockIn: (token, body) => apiRequest('/attendance/clock-in', { method: 'POST', token, body }),
  clockOut: (token, body) => apiRequest('/attendance/clock-out', { method: 'POST', token, body }),
}

export const accountingApi = {
  list: (token) => apiRequest('/accounting', { token }),
  summary: (token) => apiRequest('/accounting/summary', { token }),
  create: (token, body) => apiRequest('/accounting', { method: 'POST', token, body }),
}

export const reportsApi = {
  generate: (token, query = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, value)
    })
    const search = params.toString()
    return apiRequest(`/reports${search ? `?${search}` : ''}`, { token })
  },
}

export const settingsApi = {
  get: (token) => apiRequest('/settings', { token }),
  updatePassword: (token, body) => apiRequest('/settings/password', { method: 'PATCH', token, body }),
  updateProfile: (token, body) => apiRequest('/settings/profile', { method: 'PATCH', token, body }),
  updateCompany: (token, body) => apiRequest('/settings/company', { method: 'PATCH', token, body }),
  updatePlatform: (token, body) => apiRequest('/settings/platform', { method: 'PATCH', token, body }),
}
