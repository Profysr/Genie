import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";
import { useInvalidatingMutation } from "@/shared/hooks/useInvalidatingMutation";

const rolesKey = (workspaceId) => ["workspace-roles", workspaceId];
const membersKey = (workspaceId) => ["workspace-members", workspaceId];

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
      api.post(`/api/workspaces/${workspaceId}/roles/`, data).then((r) => r.data),
    onSuccess: (newRole) => {
      qc.setQueryData(rolesKey(workspaceId), (old = []) => [...old, newRole]);
    },
  });
};

export const useUpdateRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, ...data }) =>
      api
        .patch(`/api/workspaces/${workspaceId}/roles/${roleId}/`, data)
        .then((r) => r.data),
    onSuccess: (updatedRole) => {
      qc.setQueryData(rolesKey(workspaceId), (old = []) =>
        old.map((r) => (r.id === updatedRole.id ? updatedRole : r)),
      );
    },
  });
};

export const useDeleteRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId) =>
      api
        .delete(`/api/workspaces/${workspaceId}/roles/${roleId}/`)
        .then(() => roleId),
    onSuccess: (roleId) => {
      qc.setQueryData(rolesKey(workspaceId), (old = []) =>
        old.filter((r) => r.id !== roleId),
      );
    },
  });
};

export const useAssignRole = (workspaceId) =>
  useInvalidatingMutation(
    ({ memberId, roleId }) =>
      api
        .post(`/api/workspaces/${workspaceId}/members/${memberId}/assign-role/`, {
          role: roleId,
        })
        .then((r) => r.data),
    membersKey(workspaceId),
  );

export const useBulkAssignRole = (workspaceId) =>
  useInvalidatingMutation(
    ({ roleId, memberIds }) =>
      api
        .post(`/api/workspaces/${workspaceId}/members/bulk-assign-role/`, {
          role: roleId,
          member_ids: memberIds,
        })
        .then((r) => r.data),
    membersKey(workspaceId),
  );
