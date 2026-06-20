"""
Module Registry — single source of truth for all JCN feature modules.

Modules gate entire product areas behind a tier.  Views call
`_require_module(workspace, key)` which checks WorkspaceModule rows.
Frontend reads GET /api/workspaces/:id/modules/ and uses useModules().isEnabled(key).

Tiers:   free → always bundled
         pro  → workspace admin must explicitly enable (paid in future)
         enterprise → like pro but higher tier
"""

MODULE_REGISTRY = {
    "projects": {
        "name": "Project Management",
        "description": "Boards, tasks, sprints, Kanban, Gantt, and time tracking.",
        "tier": "free",
        "always_on": True,
        "depends_on": [],
        "icon": "layout-grid",
    },
    "org_structure": {
        "name": "Org Structure",
        "description": "Departments, teams, org chart, job titles, and reporting lines.",
        "tier": "pro",
        "always_on": False,
        "depends_on": [],
        "icon": "building-2",
    },
    "hr_management": {
        "name": "HR Management",
        "description": "Leave management, performance reviews, and headcount planning.",
        "tier": "enterprise",
        "always_on": False,
        "depends_on": ["org_structure"],
        "icon": "users-round",
    },
    "analytics_advanced": {
        "name": "Advanced Analytics",
        "description": "Custom dashboards, burndown charts, and team velocity metrics.",
        "tier": "pro",
        "always_on": False,
        "depends_on": [],
        "icon": "bar-chart-2",
    },
}

# Ordered from lowest to highest for UI display / tier comparison
TIER_ORDER = ["free", "pro", "enterprise"]
