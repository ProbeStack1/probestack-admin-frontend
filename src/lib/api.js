import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const ADMIN_BASE_PATH = process.env.PUBLIC_URL || "/admin";

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
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
      window.location.href = `${ADMIN_BASE_PATH}/login`;
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
  getDetails: (id) => api.get(`/organizations/${id}/details`),
  getBusinessUnits: (id, params) => api.get(`/organizations/${id}/business-units`, { params }),
  getTeams: (id, params) => api.get(`/organizations/${id}/teams`, { params }),
  getUsersWithRoles: (id, params) => api.get(`/organizations/${id}/users-with-roles`, { params }),
  create: (data) => api.post("/organizations", data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  approve: (id) => api.post(`/organizations/${id}/approve`),
  reject: (id, reason) => api.post(`/organizations/${id}/reject`, null, { params: { reason } }),
  delete: (id) => api.delete(`/organizations/${id}`),
};

export const subscriptionsApi = {
  getAll: (params) => api.get("/subscriptions", { params }),
  getById: (id) => api.get(`/subscriptions/${id}`),
  updateApiCount: (id, data) => api.put(`/subscriptions/${id}/api-count`, data),
  updateBillingSettings: (id, data) => api.put(`/subscriptions/${id}/billing-settings`, data),
  pause: (id) => api.post(`/subscriptions/${id}/pause`),
  resume: (id) => api.post(`/subscriptions/${id}/resume`),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
};

export const plansApi = {
  getAll: (params) => api.get("/plans", { params }),
  getInactive: (params) => api.get("/plans/inactive", { params }),
  getById: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post("/plans", data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  activate: (id) => api.post(`/plans/${id}/activate`),
  delete: (id) => api.delete(`/plans/${id}`),
  getProducts: (params) => api.get("/products", { params }),
  createProduct: (data) => api.post("/products", data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  // Plan Tools APIs
  getTools: (planId) => api.get(`/plans/${planId}/tools`),
  createTool: (planId, data) => api.post(`/plans/${planId}/tools`, data),
  updateTool: (planId, toolId, data) => api.put(`/plans/${planId}/tools/${toolId}`, data),
  deleteTool: (planId, toolId) => api.delete(`/plans/${planId}/tools/${toolId}`),
  calculatePrice: (planId, toolIds) => api.get(`/plans/${planId}/calculate-price`, { params: { tool_ids: toolIds.join(",") } }),
};


export const usersApi = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  updateRole: (id, roleIds) => api.put(`/users/${id}/role`, { role_ids: Array.isArray(roleIds) ? roleIds : [roleIds] }),
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
  downloadInvoice: (id) => api.get(`/billing/${id}/invoice.pdf`, { responseType: "blob" }),
  markPaid: (id, paymentMethod) => api.post(`/billing/${id}/mark-paid`, null, { params: { payment_method: paymentMethod } }),
  markUnpaid: (id) => api.post(`/billing/${id}/mark-unpaid`),
  generateAnnual: () => api.post("/billing/generate-annual"),
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

export const publicUsersApi = {
  issueContextToken: (data) => api.post("/public/users/context-token", data),
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

export const userRequestsApi = {
  getAll: (params) => api.get("/user-requests", { params }),
  approve: (id, params) => api.post(`/user-requests/${id}/approve`, null, { params }),
  reject: (id, reason) => api.post(`/user-requests/${id}/reject`, null, { params: { reason } }),
};

// ==================== ORG ADMIN APIs ====================

export const myOrganizationApi = {
  // Dashboard
  getDashboard: () => api.get("/my-organization/dashboard"),
  
  // Organization details
  getOrganization: () => api.get("/my-organization"),
  updateOrganization: (data) => api.put("/my-organization", data),
  
  // Subscription
  getSubscription: () => api.get("/my-organization/subscription"),
  
  // Users in my org
  getUsers: () => api.get("/my-organization/users"),
  updateUserRole: (userId, roleIds) => api.put(`/my-organization/users/${userId}/role`, { role_ids: Array.isArray(roleIds) ? roleIds : [roleIds] }),
  removeUser: (userId) => api.post(`/my-organization/users/${userId}/remove`),
  
  // Organization admins for this org
  getTeamMembers: () => api.get("/my-organization/team"),
  createTeamMember: (data) => api.post("/my-organization/team", data),
  toggleTeamMemberStatus: (id) => api.put(`/my-organization/team/${id}/toggle-status`),
  deleteTeamMember: (id) => api.delete(`/my-organization/team/${id}`),
  
  // Roles in my org
  getRoles: () => api.get("/my-organization/roles"),

  // Business units in my org
  getBusinessUnits: (params) => api.get("/my-organization/business-units", { params }),
  getBusinessUnitById: (id) => api.get(`/my-organization/business-units/${id}`),
  createBusinessUnit: (data) => api.post("/my-organization/business-units", data),
  updateBusinessUnit: (id, data) => api.put(`/my-organization/business-units/${id}`, data),

  // Projects/teams in my org
  getProjects: (params) => api.get("/my-organization/projects", { params }),
  getProjectById: (id) => api.get(`/my-organization/projects/${id}`),
  getProjectTeamMembers: () => api.get("/my-organization/project-team-members"),
  getBusinessUnitProjects: (businessUnitId) => api.get(`/my-organization/business-units/${businessUnitId}/projects`),
  createProject: (data) => api.post("/my-organization/projects", data),
  updateProject: (id, data) => api.put(`/my-organization/projects/${id}`, data),
  getProjectTeam: (projectId) => api.get(`/my-organization/projects/${projectId}/team`),
  inviteProjectTeam: (projectId, data) => api.post(`/my-organization/projects/${projectId}/team/invite`, data),

  // Applications in my org
  getApplications: (params) => api.get("/my-organization/applications", { params }),
  getApplicationById: (id) => api.get(`/my-organization/applications/${id}`),
  createApplication: (data) => api.post("/my-organization/applications", data),
  updateApplication: (id, data) => api.put(`/my-organization/applications/${id}`, data),
  
  // Billing for my org
  getBilling: () => api.get("/my-organization/billing"),
  
  // User requests
  getUserRequests: () => api.get("/my-organization/user-requests"),
  approveUserRequest: (requestId, params) => api.post(`/my-organization/user-requests/${requestId}/approve`, null, { params }),
  rejectUserRequest: (requestId, reason) => api.post(`/my-organization/user-requests/${requestId}/reject`, null, { params: { reason } }),
  
  // Upgrade requests
  getUpgradeRequests: () => api.get("/my-organization/upgrade-requests"),
  requestUpgrade: (data) => api.post("/my-organization/request-upgrade", data),
};
