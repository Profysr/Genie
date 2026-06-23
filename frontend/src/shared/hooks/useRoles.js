import { useQuery } from "@tanstack/react-query";
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

export const useCreateRole = (workspaceId) =>
  useInvalidatingMutation(
    (data) =>
      api
        .post(`/api/workspaces/${workspaceId}/roles/`, data)
        .then((r) => r.data),
    rolesKey(workspaceId),
  );

export const useUpdateRole = (workspaceId) =>
  useInvalidatingMutation(
    ({ roleId, ...data }) =>
      api
        .patch(`/api/workspaces/${workspaceId}/roles/${roleId}/`, data)
        .then((r) => r.data),
    rolesKey(workspaceId),
  );

export const useDeleteRole = (workspaceId) =>
  useInvalidatingMutation(
    (roleId) => api.delete(`/api/workspaces/${workspaceId}/roles/${roleId}/`),
    rolesKey(workspaceId),
  );

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
