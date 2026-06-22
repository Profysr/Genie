# ── vD.1 — Custom RBAC ───────────────────────────────────────────────────────
# All permission keys recognised by the system.
# Each entry: key → human-readable description (shown in the role builder UI).
PERMISSIONS = {
    # ── Projects / Boards ────────────────────────────────────────────────────
    "project.create":       "Create new projects / boards",
    "project.delete":       "Delete projects / boards",
    "project.admin":        "Manage project settings, members, and statuses",
    # ── Kanban / Tasks (checked per-action in has_project_permission) ────────
    "task.view":            "View tasks and board content",
    "task.create":          "Create tasks",
    "task.edit":            "Edit task fields (title, assignee, due date, etc.)",
    "task.delete":          "Delete tasks",
    "task.move":            "Move tasks between statuses (drag-and-drop)",
    "task.comment":         "Post and edit comments on tasks",
    "sprint.manage":        "Create, start, and complete sprints",
    "automation.manage":    "Create and edit automation rules",
    # ── People & HR ──────────────────────────────────────────────────────────
    "member.invite":        "Invite new members to the workspace",
    "member.remove":        "Remove members from the workspace",
    "member.view_profile":  "View member org profiles and contact info",
    "hr.view":              "View HR section (leave balances, attendance)",
    "hr.manage_leave":      "Approve or reject leave requests",
    "hr.manage_attendance": "Manage attendance records and policies",
    "org.view":             "View org chart, departments, and teams",
    "org.manage":           "Create and edit departments, teams, and reporting lines",
    # ── Workspace ────────────────────────────────────────────────────────────
    "report.view":          "View analytics and reports",
    "settings.manage":      "Manage workspace settings and integrations",
    "api_keys.manage":      "Create and revoke API keys",
}

# Any key NOT in PERMISSIONS is still accepted by the API — PERMISSIONS is a
# UI registry (shown in the role editor), not an enforcement gate. This means
# you can define custom permission keys (e.g. "feature.beta_dashboard") through
# the API/admin panel without touching code. Backend views that want to enforce
# a custom key just call has_workspace_permission(user, ws, "feature.beta_dashboard").

# Default permissions for each built-in system role.
# These are written into CustomRole.permissions when system roles are created.
_ALL_KEYS = list(PERMISSIONS.keys())

SYSTEM_ROLE_PERMISSIONS = {
    "Admin": {key: True for key in _ALL_KEYS},
    "Member": {
        "project.create":       True,
        "project.delete":       False,
        "project.admin":        False,
        "task.view":            True,
        "task.create":          True,
        "task.edit":            True,
        "task.delete":          False,
        "task.move":            True,
        "task.comment":         True,
        "sprint.manage":        True,
        "automation.manage":    False,
        "member.invite":        True,
        "member.remove":        False,
        "member.view_profile":  True,
        "hr.view":              True,
        "hr.manage_leave":      False,
        "hr.manage_attendance": False,
        "org.view":             True,
        "org.manage":           False,
        "report.view":          True,
        "settings.manage":      False,
        "api_keys.manage":      False,
    },
    "Viewer": {
        "project.create":       False,
        "project.delete":       False,
        "project.admin":        False,
        "task.view":            True,
        "task.create":          False,
        "task.edit":            False,
        "task.delete":          False,
        "task.move":            False,
        "task.comment":         False,
        "sprint.manage":        False,
        "automation.manage":    False,
        "member.invite":        False,
        "member.remove":        False,
        "member.view_profile":  True,
        "hr.view":              True,
        "hr.manage_leave":      False,
        "hr.manage_attendance": False,
        "org.view":             True,
        "org.manage":           False,
        "report.view":          True,
        "settings.manage":      False,
        "api_keys.manage":      False,
    },
}

# ── Registered webhook event names ──────────────────────────────────────────
# These are the public event names exposed to webhook subscribers.
# They are used:
#   • In the role-builder UI as valid event choices (WebhookCreateSerializer)
#   • In _fire_webhooks() (projects/views/helpers.py) to filter subscriber lists
#   • As the value of the X-JCN-Event header sent in each HTTP delivery
#
# Active count: 8 events (6 more commented out — not yet wired to broadcast())
#   Task (4):   task.created, task.updated, task.deleted, task.commented
#   Board (1):  status.updated
#   OKR (3):    objective.created, objective.updated, objective.deleted
#
# ── HOW TO ADD A NEW WEBHOOK EVENT ──────────────────────────────────────────
#
# Step 1 — Register the public name here (constants.py)
#   Add a string to WEBHOOK_EVENTS below, e.g. "sprint.archived".
#   Use dot-notation: "<domain>.<action>" (all lowercase).
#
# Step 2 — Map the internal broadcast key → public name (_EVENT_MAP)
#   File: backend/projects/views/helpers.py  (look for _EVENT_MAP dict, ~line 296)
#   Add an entry:
#       "sprint.archived": "sprint.archived",
#   The left side is the internal key passed to broadcast(); the right side
#   is the public event name delivered to subscribers.
#   If multiple internal actions should collapse into one public event
#   (e.g. "task.moved" → "task.updated"), map them to the same right-hand value.
#
# Step 3 — Fire the event from the relevant view or signal
#   Call broadcast() wherever the action happens:
#       from .helpers import broadcast
#       broadcast(workspace_id, "sprint.archived", serializer.data)
#   Files to edit: whichever view/signal handles the domain action
#   (projects/views/tasks.py, projects/views/objectives.py, workspaces/views.py, etc.)
#
# Step 4 — (Optional but recommended) Validate on subscription
#   File: backend/workspaces/serializers.py — WebhookCreateSerializer
#   Add a validate_events() method that rejects unknown event names:
#       from workspaces.constants import WEBHOOK_EVENTS
#       def validate_events(self, value):
#           unknown = set(value) - set(WEBHOOK_EVENTS)
#           if unknown:
#               raise serializers.ValidationError(f"Unknown events: {unknown}")
#           return value
#
# Step 5 — Write the payload shape in a comment near the broadcast() call
#   Future maintainers (and webhook consumers) need to know what fields to
#   expect. A one-line comment next to the broadcast() call is enough.
# ─────────────────────────────────────────────────────────────────────────────
WEBHOOK_EVENTS = [
    # Task
    "task.created",
    "task.updated",
    "task.deleted",
    # "task.assigned",    # not yet wired — no broadcast() call
    "task.commented",
    # "task.completed",   # not yet wired — no broadcast() call
    # Board
    "status.updated",
    # Sprint
    # "sprint.started",   # not yet wired — no broadcast() call
    # "sprint.completed", # not yet wired — no broadcast() call
    # Members
    # "member.added",     # not yet wired — no broadcast() call
    # "member.removed",   # not yet wired — no broadcast() call
    # OKRs
    "objective.created",
    "objective.updated",
    "objective.deleted",
]
