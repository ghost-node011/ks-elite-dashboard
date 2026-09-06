import { API_BASE } from "./api";

const TOKEN_KEY = "ks_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class AuthError extends Error {}

// Thin authenticated fetch wrapper. Throws AuthError on 401 so callers/AdminGuard
// can uniformly bounce back to the login screen when the session expires.
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    throw new AuthError("Session expired. Please log in again.");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login failed.");
  setToken(data.token);
  return data.token;
}

export async function refreshToken() {
  const data = await request("/admin/auth/refresh", { method: "POST" });
  setToken(data.token);
  return data.token;
}

// ── current user / staff management ─────────────────────────────────────
export const getMe = () => request("/admin/auth/me");
export const getSections = () => request("/admin/auth/sections");
export const getAdminUsers = () => request("/admin/auth/users");
export const createAdminUser = (payload) => request("/admin/auth/users", { method: "POST", body: JSON.stringify(payload) });
export const updateAdminUser = (id, payload) => request(`/admin/auth/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteAdminUser = (id) => request(`/admin/auth/users/${id}`, { method: "DELETE" });

// ── subscribers ──────────────────────────────────────────────────────────
export const getSubscribers = (page = 1, limit = 50) => request(`/subscribers?page=${page}&limit=${limit}`);
export const deleteSubscriber = (id) => request(`/subscribers/${id}`, { method: "DELETE" });

// ── leads ────────────────────────────────────────────────────────────────
export const getContacts = (page = 1, limit = 50) => request(`/contact?page=${page}&limit=${limit}`);
export const getInternships = (page = 1, limit = 50, { year = "", month = "" } = {}) =>
  request(`/internship?page=${page}&limit=${limit}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`);
export const getInternshipSummary = () => request("/internship/summary");
export const updateLeadStatus = (kind, id, status) =>
  request(`/${kind}/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteLead = (kind, id) => request(`/${kind}/${id}`, { method: "DELETE" });

// ── posts ────────────────────────────────────────────────────────────────
export const getAllPosts = () => request("/posts/admin/all");
export const getPost = (id) => request(`/posts/admin/${id}`);
export const createPost = (payload) => request("/posts/admin", { method: "POST", body: JSON.stringify(payload) });
export const updatePost = (id, payload) => request(`/posts/admin/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deletePost = (id) => request(`/posts/admin/${id}`, { method: "DELETE" });

// ── authors (reusable byline profiles) ──────────────────────────────────
export const getAuthors = () => request("/authors/admin");
export const createAuthor = (payload) => request("/authors/admin", { method: "POST", body: JSON.stringify(payload) });
export const updateAuthor = (id, payload) => request(`/authors/admin/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteAuthor = (id) => request(`/authors/admin/${id}`, { method: "DELETE" });

// ── team ─────────────────────────────────────────────────────────────────
export const getAllTeam = () => request("/team/admin/all");
export const getTeamMember = (id) => request(`/team/admin/${id}`);
export const createTeamMember = (payload) => request("/team/admin", { method: "POST", body: JSON.stringify(payload) });
export const updateTeamMember = (id, payload) => request(`/team/admin/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteTeamMember = (id) => request(`/team/admin/${id}`, { method: "DELETE" });

// ── testimonials ─────────────────────────────────────────────────────────
export const getAllTestimonials = () => request("/testimonials/admin/all");
export const getTestimonial = (id) => request(`/testimonials/admin/${id}`);
export const createTestimonial = (payload) => request("/testimonials/admin", { method: "POST", body: JSON.stringify(payload) });
export const updateTestimonial = (id, payload) => request(`/testimonials/admin/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteTestimonial = (id) => request(`/testimonials/admin/${id}`, { method: "DELETE" });

// ── cases ────────────────────────────────────────────────────────────────
export const getAllCases = (page = 1, limit = 50, { name = "", nextDate = "" } = {}) =>
  request(`/cases/admin/all?page=${page}&limit=${limit}&name=${encodeURIComponent(name)}&nextDate=${encodeURIComponent(nextDate)}`);
export const getCase = (id) => request(`/cases/admin/${id}`);
export const createCase = (payload) => request("/cases/admin", { method: "POST", body: JSON.stringify(payload) });
export const updateCase = (id, payload) => request(`/cases/admin/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const addCaseDate = (id, nextDate) => request(`/cases/admin/${id}/add-date`, { method: "POST", body: JSON.stringify({ nextDate }) });
export const deleteCase = (id) => request(`/cases/admin/${id}`, { method: "DELETE" });

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/admin/upload-file", { method: "POST", body: form });
}

// ── AI + document import ────────────────────────────────────────────────
export const draftPost = (topic, notes) =>
  request("/admin/ai/draft", { method: "POST", body: JSON.stringify({ topic, notes }) });

export const fixSectionHtml = (html) =>
  request("/admin/ai/fix-section", { method: "POST", body: JSON.stringify({ html }) });

export const suggestHeroImages = (title, category, excerpt) =>
  request("/admin/ai/suggest-images", { method: "POST", body: JSON.stringify({ title, category, excerpt }) });

export const getGreeting = () => request("/admin/ai/greeting", { method: "POST" });

export const askAssistant = (messages) =>
  request("/admin/assistant/chat", { method: "POST", body: JSON.stringify({ messages }) });

// ── analytics ────────────────────────────────────────────────────────────
export const getAnalytics = () => request("/admin/analytics");

export async function parseDocument(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/parse-doc", { method: "POST", body: form });
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/admin/upload-image", { method: "POST", body: form });
}
