"""
workspaces/rbac.py — Custom RBAC helpers (Phase D).

Public surface
--------------
has_workspace_permission(user, workspace, action) -> bool
    Returns True if the user is allowed to perform `action` in `workspace`.

    Resolution order:
    1. Workspace owner → always True (full admin).
    2. RoleAssignment → check CustomRole.permissions[action].
    3. No assignment → False (member must be assigned a role).

create_system_roles(workspace) -> dict[str, CustomRole]
    Creates the three built-in system roles for a workspace and returns them.
    Idempotent via get_or_create.
"""

from .constants import SYSTEM_ROLE_PERMISSIONS


def has_workspace_permission(user, workspace, action: str) -> bool:
    """Return True if `user` has `action` permission in `workspace`."""
    from .models import RoleAssignment, WorkspaceMember

    if workspace.owner_id == user.pk:
        return True

    try:
        member = WorkspaceMember.objects.select_related("role_assignment__role").get(
            workspace=workspace, user=user
        )
    except WorkspaceMember.DoesNotExist:
        return False

    try:
        return bool(member.role_assignment.role.permissions.get(action, False))
    except RoleAssignment.DoesNotExist:
        return False


def create_system_roles(workspace):
    """
    Ensure the three built-in system roles exist for `workspace`.
    Returns a dict {role_name: CustomRole instance}.
    """
    from .models import CustomRole

    roles = {}
    for name, perms in SYSTEM_ROLE_PERMISSIONS.items():
        role, _ = CustomRole.objects.get_or_create(
            workspace=workspace,
            name=name,
            defaults={
                "description": f"Built-in {name} role",
                "is_system": True,
                "permissions": perms,
            },
        )
        roles[name] = role
    return roles
