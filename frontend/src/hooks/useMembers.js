import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const membersKey = (slug) => ["workspace-members", slug];

export const useMembers = (workspaceSlug) =>
  useQuery({
    queryKey: membersKey(workspaceSlug),
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceSlug}/members/`).then((r) => r.data.results || r.data),
    enabled: !!workspaceSlug,
  });

export const useInviteMember = (workspaceSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post(`/api/workspaces/${workspaceSlug}/invites/`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(workspaceSlug) }),
  });
};

export const useUpdateMemberRole = (workspaceSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }) =>
      api.patch(`/api/workspaces/${workspaceSlug}/members/${memberId}/`, { role }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(workspaceSlug) }),
  });
};

export const useRemoveMember = (workspaceSlug) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId) =>
      api.delete(`/api/workspaces/${workspaceSlug}/members/${memberId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(workspaceSlug) }),
  });
};
