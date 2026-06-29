import axios from "axios";
import { BACKEND_URL } from "@/shared/lib/env";

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Let axios set multipart/form-data (with boundary) automatically for FormData payloads
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

/**
 * Normalize a DRF error body into a single human-readable string.
 * Handles: { detail }, { non_field_errors }, { field: [msg] }, plain strings.
 */
function extractApiMessage(data) {
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (data.detail) return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length)
    return data.non_field_errors[0];
  // Field-level errors — return the first message found
  for (const val of Object.values(data)) {
    if (Array.isArray(val) && val.length) return val[0];
  }
  return "Something went wrong. Please try again.";
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${BACKEND_URL}/api/auth/token/refresh/`,
            { refresh },
          );
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          [
            "access_token",
            "refresh_token",
            "accessToken",
            "refreshToken",
            "auth",
          ].forEach((k) => localStorage.removeItem(k));
          window.location.href = "/login";
        }
      }
    }

    // Attach a normalized message so every onError handler can use err.message
    error.message = extractApiMessage(error.response?.data);
    return Promise.reject(error);
  },
);

export default api;
