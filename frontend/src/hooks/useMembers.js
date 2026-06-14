import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const membersKey = (workspaceId) => ["workspace-members", workspaceId];

export const useMembers = (workspaceId) =>
  useQuery({
    queryKey: membersKey(workspaceId),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/members/`).then((r) => r.data.results || r.data),
    enabled: !!workspaceId,
  });

export const useInviteMember = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/workspaces/${workspaceId}/invites/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(workspaceId) }),
  });
};

export const useUpdateMemberRole = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }) =>
      api.patch(`/api/workspaces/${workspaceId}/members/${memberId}/`, { role }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(workspaceId) }),
  });
};

export const useRemoveMember = (workspaceId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId) =>
      api.delete(`/api/workspaces/${workspaceId}/members/${memberId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(workspaceId) }),
  });
};
