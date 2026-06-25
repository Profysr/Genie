"""
Project-level permission utilities (vD.1).

How it works
============
has_project_permission(user, board, action) is the single entry point.

1. Workspace owner → always True.
2. CustomRole permission check via has_workspace_permission() — fully data-driven.
   Any permission key can be created through the API without code changes.
3. BoardMember override — a per-board role can grant extra access within one board
   (e.g. a Viewer-level member promoted to editor on one specific board).

Action → permission key mapping (_ACTION_TO_PERM):
  "view"   → "task.view"
  "edit"   → "task.edit"
  "delete" → "task.delete"
  "move"   → "task.move"
  "comment"→ "task.comment"
  "admin"  → "board.admin"

Adding a new board action requires only one new entry in _ACTION_TO_PERM — no
weight constants, no threshold tables.

get_effective_role() is kept for serializers that need a role string (e.g.
BoardMemberSerializer). New code should call has_project_permission() directly.
"""
from workspaces.models import WorkspaceMember
from workspaces.rbac import has_workspace_permission

# Maps board actions to workspace-level CustomRole permission keys.
# To add a new action: add one entry here. No other code change needed.
_ACTION_TO_PERM = {
    "view":           "task.view",
    "edit":           "task.edit",
    "delete":         "task.delete",
    "move":           "task.move",
    "comment":        "task.comment",
    "admin":          "board.admin",
}

# Board-level role weights — used only for BoardMember override fallback.
_PROJ_WEIGHT = {"admin": 4, "editor": 3, "viewer": 2, "guest": 1}
_ACTION_MIN  = {"view": 2, "edit": 3, "delete": 4, "move": 3, "comment": 2, "admin": 4}


def has_project_permission(user, board, action):
    """
    Return True if *user* can perform *action* on *board*.

    Checks (in order):
      1. Workspace owner → True.
      2. CustomRole has the matching permission → True.
      3. BoardMember override role meets the action threshold → True.
      4. Otherwise → False.
    """
    from .models import BoardMember

    workspace = board.workspace

    if not WorkspaceMember.objects.filter(workspace=workspace, user=user).exists():
        return False

    if workspace.owner_id == user.pk:
        return True

    # Primary check: workspace-level CustomRole permission (data-driven).
    perm_key = _ACTION_TO_PERM.get(action)
    if perm_key and has_workspace_permission(user, workspace, perm_key):
        return True

    # Fallback: per-board BoardMember override can grant additional access.
    try:
        bm = BoardMember.objects.get(board=board, user=user)
        return _PROJ_WEIGHT.get(bm.role, 0) >= _ACTION_MIN.get(action, 999)
    except BoardMember.DoesNotExist:
        return False


def get_effective_role(user, board):
    """
    Return the effective board role string for serializers that need it,
    or None if the user has no access.

    Derives the string from has_project_permission() so the two are always
    in sync — no separate logic to maintain.
    """
    if not has_project_permission(user, board, "view"):
        return None
    if has_project_permission(user, board, "admin"):
        return "admin"
    if has_project_permission(user, board, "edit"):
        return "editor"
    return "viewer"


def log_audit(actor, workspace, action, resource_type, resource_id, before=None, after=None):
    """Write an immutable AuditEvent row."""
    from .models import AuditEvent
    AuditEvent.objects.create(
        workspace=workspace,
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        before=before or {},
        after=after or {},
    )


def bulk_log_audit(actor, workspace, action, resource_type, entries):
    """Write multiple AuditEvent rows in one query.

    entries: iterable of dicts with keys resource_id, before (opt), after (opt).
    """
    from .models import AuditEvent
    AuditEvent.objects.bulk_create([
        AuditEvent(
            workspace=workspace,
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=str(entry["resource_id"]),
            before=entry.get("before") or {},
            after=entry.get("after") or {},
        )
        for entry in entries
    ])
