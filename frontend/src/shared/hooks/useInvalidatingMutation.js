import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * A `useMutation` that invalidates one or more query keys on success.
 *
 * Collapses the repeated CRUD-hook boilerplate
 *   const qc = useQueryClient();
 *   return useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey }) });
 * into a single call. Pass as many query keys as the mutation should invalidate.
 *
 * For mutations that need richer onSuccess behaviour (setQueryData, navigation,
 * reading the response), use `useMutation` directly instead.
 *
 * @param {Function} mutationFn - the async request, e.g. `(data) => api.post(url, data).then((r) => r.data)`
 * @param {...Array} queryKeys - query keys to invalidate on success
 */
export function useInvalidatingMutation(mutationFn, ...queryKeys) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryKeys.forEach((queryKey) => qc.invalidateQueries({ queryKey })),
  });
}
