import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/components/ui/toast";

/**
 * A `useMutation` that invalidates one or more query keys on success and shows
 * a generic error toast on failure.
 *
 * @param {Function} mutationFn - the async request
 * @param {...Array} queryKeys  - query keys to invalidate on success
 */
export function useInvalidatingMutation(mutationFn, ...queryKeys) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryKeys.forEach((queryKey) => qc.invalidateQueries({ queryKey })),
    onError: () => toast({ title: "Something went wrong", type: "error" }),
  });
}
