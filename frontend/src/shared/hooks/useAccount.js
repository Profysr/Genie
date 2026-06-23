import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { useAuthStore } from "@/store/authStore";

/**
 * Hooks for the current user's own account (profile, avatar, password).
 * UI feedback (success/error toasts, local state) is left to the call site via
 * mutate's second-arg callbacks — these hooks own the data layer only.
 */

// PATCH /api/users/me/ — update own profile (name, avatar settings, …).
// Keeps the `["me"]` cache and the Zustand auth store in sync.
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch("/api/users/me/", data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(["me"], updated);
      useAuthStore.setState((s) => ({ ...s, user: { ...s.user, ...updated } }));
    },
  });
};

// POST /api/auth/password/change/ — dj_rest_auth built-in endpoint.
export const useChangePassword = () =>
  useMutation({
    mutationFn: (data) =>
      api.post("/api/auth/password/change/", data).then((r) => r.data),
  });

// POST /api/auth/password/reset/ — request a reset email for `email`.
export const useRequestPasswordReset = () =>
  useMutation({
    mutationFn: (email) =>
      api.post("/api/auth/password/reset/", { email }).then((r) => r.data),
  });
