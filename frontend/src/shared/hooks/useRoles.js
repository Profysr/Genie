import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/lib/api";

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

export const useAssignRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, roleId }) =>
      api
        .post(`/api/workspaces/${workspaceId}/members/${memberId}/assign-role/`, {
          role: roleId,
        })
        .then((r) => r.data),
    onSuccess: (assignment, { memberId }) => {
      const roleName = assignment.role_name;
      if (!roleName) return;
      qc.setQueryData(membersKey(workspaceId), (old = []) =>
        old.map((m) => (m.id === memberId ? { ...m, role: roleName } : m)),
      );
    },
  });
};

export const useBulkAssignRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, memberIds }) =>
      api
        .post(`/api/workspaces/${workspaceId}/members/bulk-assign-role/`, {
          role: roleId,
          member_ids: memberIds,
        })
        .then((r) => r.data),
    onSuccess: (_, { roleId, memberIds }) => {
      const roles = qc.getQueryData(rolesKey(workspaceId)) ?? [];
      const role = roles.find((r) => r.id === roleId);
      if (!role) return;
      const idSet = new Set(memberIds);
      qc.setQueryData(membersKey(workspaceId), (old = []) =>
        old.map((m) => (idSet.has(m.id) ? { ...m, role: role.name } : m)),
      );
    },
  });
};
