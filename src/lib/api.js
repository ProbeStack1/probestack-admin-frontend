import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==================== SUPER ADMIN APIs ====================

export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
};

export const organizationsApi = {
  getAll: (params) => api.get("/organizations", { params }),
  getPending: () => api.get("/organizations/pending"),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post("/organizations", data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  approve: (id) => api.post(`/organizations/${id}/approve`),
  reject: (id, reason) => api.post(`/organizations/${id}/reject`, null, { params: { reason } }),
  delete: (id) => api.delete(`/organizations/${id}`),
};

export const subscriptionsApi = {
  getAll: (params) => api.get("/subscriptions", { params }),
  getById: (id) => api.get(`/subscriptions/${id}`),
  pause: (id) => api.post(`/subscriptions/${id}/pause`),
  resume: (id) => api.post(`/subscriptions/${id}/resume`),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
};

export const plansApi = {
  getAll: (params) => api.get("/plans", { params }),
  getById: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post("/plans", data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

export const usersApi = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  updateStatus: (id, status) => api.put(`/users/${id}/status`, null, { params: { status } }),
  delete: (id) => api.delete(`/users/${id}`),
};

export const rolesApi = {
  getAll: (params) => api.get("/roles", { params }),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post("/roles", data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

export const billingApi = {
  getAll: (params) => api.get("/billing", { params }),
  getById: (id) => api.get(`/billing/${id}`),
  markPaid: (id, paymentMethod) => api.post(`/billing/${id}/mark-paid`, null, { params: { payment_method: paymentMethod } }),
  markUnpaid: (id) => api.post(`/billing/${id}/mark-unpaid`),
  generateMonthly: () => api.post("/billing/generate-monthly"),
};

export const notificationsApi = {
  getAll: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const seedApi = {
  seed: () => api.post("/seed"),
};

export const adminsApi = {
  getAll: () => api.get("/admins"),
  create: (data) => api.post("/admins", data),
  toggleStatus: (id) => api.put(`/admins/${id}/toggle-status`),
  delete: (id) => api.delete(`/admins/${id}`),
};

export const upgradeRequestsApi = {
  getAll: () => api.get("/upgrade-requests"),
  approve: (id) => api.post(`/upgrade-requests/${id}/approve`),
  reject: (id, reason) => api.post(`/upgrade-requests/${id}/reject`, null, { params: { reason } }),
};

// ==================== ORG ADMIN APIs ====================

export const myOrganizationApi = {
  // Dashboard
  getDashboard: () => api.get("/my-organization/dashboard"),
  
  // Organization details
  getOrganization: () => api.get("/my-organization"),
  
  // Subscription
  getSubscription: () => api.get("/my-organization/subscription"),
  
  // Users in my org
  getUsers: () => api.get("/my-organization/users"),
  removeUser: (userId) => api.post(`/my-organization/users/${userId}/remove`),
  
  // Team members (org admins for this org)
  getTeamMembers: () => api.get("/my-organization/team"),
  createTeamMember: (data) => api.post("/my-organization/team", data),
  toggleTeamMemberStatus: (id) => api.put(`/my-organization/team/${id}/toggle-status`),
  deleteTeamMember: (id) => api.delete(`/my-organization/team/${id}`),
  
  // Roles in my org
  getRoles: () => api.get("/my-organization/roles"),
  
  // Billing for my org
  getBilling: () => api.get("/my-organization/billing"),
  
  // User requests
  getUserRequests: () => api.get("/my-organization/user-requests"),
  approveUserRequest: (requestId, roleId) => api.post(`/my-organization/user-requests/${requestId}/approve`, null, { params: { role_id: roleId } }),
  rejectUserRequest: (requestId, reason) => api.post(`/my-organization/user-requests/${requestId}/reject`, null, { params: { reason } }),
  
  // Upgrade requests
  getUpgradeRequests: () => api.get("/my-organization/upgrade-requests"),
  requestUpgrade: (data) => api.post("/my-organization/request-upgrade", data),
};
