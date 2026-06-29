"""
workspaces/permissions.py — App-level and fine-grained permission helpers.

Replaces the old require_module() / module-gating approach.
App access is now part of the role (CustomRole.app_access), not a
workspace-level module toggle.

Public surface
--------------
has_app_access(user, workspace, app_key) -> bool
    Returns True if the user's role grants access to the given app.

has_permission(user, workspace, app_key, perm_key) -> bool
    Returns True if the user's role grants the specific permission.
    Implicitly requires app access first.

get_enabled_permissions(workspace) -> dict
    Returns PERMISSIONS filtered to apps available for this workspace.
    Currently returns all apps (no module gating). Pass workspace for future extensibility (e.g. per-workspace app toggles).
"""

from .constants import APP_REGISTRY, PERMISSIONS

# Reverse map: "settings.manage" → "workspace", "task.create" → "projects", etc.
_PERM_TO_APP = {
    perm_key: app_key
    for app_key, perms in PERMISSIONS.items()
    for perm_key in perms
}

def _get_role(user, workspace):
    """Return the user's CustomRole for this workspace, or None."""
    from .models import WorkspaceMember
    try:
        member = (
            WorkspaceMember.objects
            .select_related("role_assignment__role")
            .get(workspace=workspace, user=user)
        )
        return member.role_assignment.role
    except (WorkspaceMember.DoesNotExist, Exception):
        return None


def has_app_access(user, workspace, app_key: str) -> bool:
    """Return True if the user can access the given app in this workspace."""
    if workspace.owner_id == user.pk:
        return True
    role = _get_role(user, workspace)
    if role is None:
        return False
    return bool(role.app_access.get(app_key, False))


def require_app_access(user, workspace, app_key: str):
    """Raise PermissionDenied if the user cannot access the given app."""
    from rest_framework.exceptions import PermissionDenied
    if not has_app_access(user, workspace, app_key):
        name = APP_REGISTRY.get(app_key, {}).get("name", app_key)
        raise PermissionDenied(
            {
                "detail": f"You do not have access to {name}.",
                "app": app_key,
            }
        )


def has_permission(user, workspace, app_key: str, perm_key: str) -> bool:
    """Return True if the user has a specific permission within an app."""
    if workspace.owner_id == user.pk:
        return True
    # "workspace" is a special pseudo-group (invite, settings, api_keys) that is
    # never listed in APP_REGISTRY and therefore never present in role.app_access.
    # Skip the app-access gate for it so workspace-level permissions can resolve.
    if app_key != "workspace" and not has_app_access(user, workspace, app_key):
        return False
    role = _get_role(user, workspace)
    if role is None:
        return False
    return bool(role.permissions.get(app_key, {}).get(perm_key, False))


def resolve_permission(user, workspace, perm_key: str) -> bool:
    """
    Check a permission by key alone, without knowing the app.
    Uses the registry reverse map to find the app directly — no scanning.
    """
    if workspace.owner_id == user.pk:
        return True
    app_key = _PERM_TO_APP.get(perm_key)
    if app_key is None:
        return False
    return has_permission(user, workspace, app_key, perm_key)


def get_enabled_apps(workspace, user):
    """Return APP_REGISTRY filtered to apps the user can access.
    Admins and owners get the full registry.
    """
    if resolve_permission(user, workspace, "settings.manage"):
        return APP_REGISTRY
    return {
        app_key: app_def
        for app_key, app_def in APP_REGISTRY.items()
        if has_app_access(user, workspace, app_key)
    }


def get_enabled_permissions(workspace, user):
    """Return PERMISSIONS filtered to apps the user can access.
    Admins and owners get the full registry.
    The 'workspace' group is always included (never app-gated).
    """
    if resolve_permission(user, workspace, "settings.manage"):
        return PERMISSIONS
    return {
        app_key: perms
        for app_key, perms in PERMISSIONS.items()
        if app_key == "workspace" or has_app_access(user, workspace, app_key)
    }
