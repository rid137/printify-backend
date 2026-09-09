import { apiRequest } from "./client";
import type { Paginated, User } from "./types";

export const usersApi = {
  profile: () => apiRequest<User>("/api/user/profile"),

  updateProfile: (body: { username?: string; email?: string }) =>
    apiRequest<User>("/api/user/profile", { method: "PUT", body }),

  list: (query: { page?: number; size?: number }) =>
    apiRequest<Paginated<User>>("/api/admin/all-users", { query }),

  admins: () => apiRequest<User[]>("/api/admin/admin-users"),

  get: (id: string) => apiRequest<User>(`/api/admin/current-user/${id}`),

  update: (id: string, body: { username?: string; email?: string; role?: "user" | "admin" }) =>
    apiRequest<User>(`/api/admin/current-user/${id}`, { method: "PUT", body }),

  remove: (id: string) =>
    apiRequest<User>(`/api/admin/current-user/${id}`, { method: "DELETE" }),
};
