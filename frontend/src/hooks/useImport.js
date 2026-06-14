import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useImportSources(workspaceId) {
  return useQuery({
    queryKey: ["import", workspaceId, "sources"],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/import/sources/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: Infinity,
  });
}

export function useImportJobs(workspaceId) {
  return useQuery({
    queryKey: ["import", workspaceId, "jobs"],
    queryFn: () =>
      api.get(`/api/workspaces/${workspaceId}/import/jobs/`).then((r) => r.data),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useImportJob(workspaceId, jobId) {
  return useQuery({
    queryKey: ["import", workspaceId, "jobs", jobId],
    queryFn: () =>
      api
        .get(`/api/workspaces/${workspaceId}/import/jobs/${jobId}/`)
        .then((r) => r.data),
    enabled: !!(workspaceId && jobId),
    refetchInterval: (data) =>
      data?.status === "importing" ? 2000 : false,
  });
}

/** Upload a file and get back job_id + preview + field_mapping */
export function useUploadImport(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ source, file }) => {
      const fd = new FormData();
      fd.append("source", source);
      fd.append("file", file);
      return api
        .post(`/api/workspaces/${workspaceId}/import/jobs/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["import", workspaceId, "jobs"] }),
  });
}

/** Save updated field mapping */
export function useUpdateImportMapping(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, field_mapping }) =>
      api
        .patch(`/api/workspaces/${workspaceId}/import/jobs/${jobId}/`, { field_mapping })
        .then((r) => r.data),
    onSuccess: (_, { jobId }) =>
      qc.invalidateQueries({ queryKey: ["import", workspaceId, "jobs", jobId] }),
  });
}

/** Kick off the actual import */
export function useRunImport(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId) =>
      api
        .post(`/api/workspaces/${workspaceId}/import/jobs/${jobId}/run/`)
        .then((r) => r.data),
    onSuccess: (_, jobId) =>
      qc.invalidateQueries({ queryKey: ["import", workspaceId, "jobs", jobId] }),
  });
}

/** Delete a job from history (not allowed while importing) */
export function useDeleteImportJob(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId) =>
      api
        .delete(`/api/workspaces/${workspaceId}/import/jobs/${jobId}/`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["import", workspaceId, "jobs"] }),
  });
}

/** Rollback an import within 24 h */
export function useRollbackImport(workspaceId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId) =>
      api
        .delete(`/api/workspaces/${workspaceId}/import/jobs/${jobId}/rollback/`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["import", workspaceId, "jobs"] }),
  });
}
