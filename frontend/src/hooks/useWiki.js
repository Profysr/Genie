import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const wikiBase = (ws, proj) => `/api/workspaces/${ws}/projects/${proj}/wiki/`;
const docBase  = (ws)       => `/api/workspaces/${ws}/documents/`;

// ── Wiki pages ────────────────────────────────────────────────────────────────

export function useWikiPages(workspaceSlug, projectId) {
  return useQuery({
    queryKey: ["wiki", workspaceSlug, projectId],
    queryFn: () => api.get(wikiBase(workspaceSlug, projectId)).then(r => r.data),
    enabled: !!projectId,
  });
}

export function useWikiPage(workspaceSlug, projectId, pageId) {
  return useQuery({
    queryKey: ["wiki-page", workspaceSlug, projectId, pageId],
    queryFn: () => api.get(`${wikiBase(workspaceSlug, projectId)}${pageId}/`).then(r => r.data),
    enabled: !!pageId,
  });
}

export function useCreateWikiPage(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(wikiBase(workspaceSlug, projectId), data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki", workspaceSlug, projectId] }),
  });
}

export function useUpdateWikiPage(workspaceSlug, projectId, pageId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`${wikiBase(workspaceSlug, projectId)}${pageId}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wiki-page", workspaceSlug, projectId, pageId] });
      qc.invalidateQueries({ queryKey: ["wiki", workspaceSlug, projectId] });
    },
  });
}

export function useDeleteWikiPage(workspaceSlug, projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pageId) => api.delete(`${wikiBase(workspaceSlug, projectId)}${pageId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wiki", workspaceSlug, projectId] }),
  });
}

export function useWikiRevisions(workspaceSlug, projectId, pageId) {
  return useQuery({
    queryKey: ["wiki-revisions", workspaceSlug, projectId, pageId],
    queryFn: () => api.get(`${wikiBase(workspaceSlug, projectId)}${pageId}/revisions/`).then(r => r.data),
    enabled: !!pageId,
  });
}

// ── Documents ─────────────────────────────────────────────────────────────────

export function useDocuments(workspaceSlug) {
  return useQuery({
    queryKey: ["documents", workspaceSlug],
    queryFn: () => api.get(docBase(workspaceSlug)).then(r => r.data),
    enabled: !!workspaceSlug,
  });
}

export function useDocument(workspaceSlug, docId) {
  return useQuery({
    queryKey: ["document", workspaceSlug, docId],
    queryFn: () => api.get(`${docBase(workspaceSlug)}${docId}/`).then(r => r.data),
    enabled: !!docId,
  });
}

export function useCreateDocument(workspaceSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(docBase(workspaceSlug), data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", workspaceSlug] }),
  });
}

export function useUpdateDocument(workspaceSlug, docId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch(`${docBase(workspaceSlug)}${docId}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document", workspaceSlug, docId] });
      qc.invalidateQueries({ queryKey: ["documents", workspaceSlug] });
    },
  });
}

export function useDeleteDocument(workspaceSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId) => api.delete(`${docBase(workspaceSlug)}${docId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", workspaceSlug] }),
  });
}
