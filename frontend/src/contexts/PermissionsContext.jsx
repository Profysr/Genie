import { createContext, useContext, useMemo } from "react";
import { useWorkspace } from "@/shared/hooks/useWorkspace";
import { useRoles } from "@/shared/hooks/useRoles";
import { useAuthStore } from "@/store/authStore";

const PermissionsContext = createContext({
  can: () => false,
  isOwner: false,
  isLoading: true,
  myRole: null,
});

export function PermissionsProvider({ workspaceId, children }) {
  const { user } = useAuthStore();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: roles = [], isLoading } = useRoles(workspaceId);

  const ctx = useMemo(() => {
    const isOwner = !!user && !!workspace && workspace.owner?.id === user.id;

    if (isOwner) {
      return {
        can: () => true,
        isOwner: true,
        isLoading: false,
        myRole: null,
      };
    }

    const myRoleName = workspace?.my_role;
    const myRole = roles.find((r) => r.name === myRoleName) ?? null;
    const permissions = myRole?.permissions ?? {};

    return {
      can: (key) => !!permissions[key],
      isOwner: false,
      isLoading: isLoading || !workspace,
      myRole,
    };
  }, [workspace, roles, user, isLoading]);

  return (
    <PermissionsContext.Provider value={ctx}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionsContext);
}
