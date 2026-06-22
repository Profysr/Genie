import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

const rolesKey = (workspaceId) => ["workspace-roles", workspaceId];

export const useRoles = (workspaceId) =>
  useQuery({
    queryKey: rolesKey(workspaceId),
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/roles/`)
        .then((r) => r.data.results ?? r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
  });

export const useCreateRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .post(`/api/workspaces/${workspaceId}/roles/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: rolesKey(workspaceId) }),
  });
};

export const useUpdateRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, ...data }) =>
      api
        .patch(`/api/workspaces/${workspaceId}/roles/${roleId}/`, data)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: rolesKey(workspaceId) }),
  });
};

export const useDeleteRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId) =>
      api.delete(`/api/workspaces/${workspaceId}/roles/${roleId}/`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: rolesKey(workspaceId) }),
  });
};

export const useAssignRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, roleId }) =>
      api
        .post(
          `/api/workspaces/${workspaceId}/members/${memberId}/assign-role/`,
          { role: roleId },
        )
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["workspace-members", workspaceId] }),
  });
};
