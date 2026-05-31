import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setTokens: (access, refresh) => {
        localStorage.setItem("access_token", access);
        if (refresh) localStorage.setItem("refresh_token", refresh);
        set({ accessToken: access, refreshToken: refresh });
      },

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        const { data } = await api.post("/api/auth/login/", { email, password });
        get().setTokens(data.access, data.refresh);
        set({ user: data.user });
        return data;
      },

      register: async (email, password1, password2, full_name) => {
        const { data } = await api.post("/api/auth/registration/", {
          email, password1, password2, full_name,
        });
        get().setTokens(data.access, data.refresh);
        set({ user: data.user });
        return data;
      },

      logout: async () => {
        try {
          const refresh = localStorage.getItem("refresh_token");
          await api.post("/api/auth/logout/", { refresh });
        } catch {}
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchMe: async () => {
        const { data } = await api.get("/api/users/me/");
        set({ user: data });
        return data;
      },
    }),
    {
      name: "auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
