const TOKEN_KEY = "feedback_loop_token";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string) {
  // Production: same-origin /api (Netlify proxy → Render)
  if (import.meta.env.PROD) return path;
  return API_BASE ? `${API_BASE}${path}` : path;
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export interface User {
  id: string;
  username: string;
  email: string;
  businessName: string;
  aspects: string[];
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface FeedbackEntry {
  id: string;
  businessName: string;
  consumerName: string | null;
  isAnonymous: boolean;
  rating: number;
  text: string;
  aspects: string[];
  createdAt: string;
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(
      "Gagal terhubung ke server. Periksa koneksi internet atau konfigurasi API.",
    );
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Permintaan gagal.");
  }
  return data as T;
}

export async function registerUser(payload: RegisterPayload) {
  const response = await apiFetch(apiUrl("/api/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ message: string; user: User }>(response);
}

export async function loginUser(payload: LoginPayload) {
  const response = await apiFetch(apiUrl("/api/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ message: string; token: string; user: User }>(response);
}

export async function fetchMe() {
  const response = await apiFetch(apiUrl("/api/me"), { headers: authHeaders() });
  return parseResponse<{ user: User }>(response);
}

export async function updateSettings(payload: {
  businessName?: string;
  aspects?: string[];
}) {
  const response = await apiFetch(apiUrl("/api/me/settings"), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse<{ user: User }>(response);
}

export async function fetchFeedbacks() {
  const response = await apiFetch(apiUrl("/api/dashboard/feedbacks"), { headers: authHeaders() });
  return parseResponse<{ feedbacks: FeedbackEntry[] }>(response);
}

export async function fetchAiSummary() {
  const response = await apiFetch(apiUrl("/api/dashboard/summary"), { headers: authHeaders() });
  return parseResponse<{ bullets: string[]; status: string }>(response);
}

export async function submitFeedback(payload: {
  businessName: string;
  consumerName?: string;
  isAnonymous: boolean;
  rating: number;
  text: string;
  aspects: string[];
  clientId: string;
}) {
  const response = await apiFetch(apiUrl("/api/feedback"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ message: string }>(response);
}

export async function fetchFormConfig(usaha: string) {
  const response = await apiFetch(apiUrl(`/api/form-config?usaha=${encodeURIComponent(usaha)}`));
  return parseResponse<{ aspects: string[]; businessName: string }>(response);
}
