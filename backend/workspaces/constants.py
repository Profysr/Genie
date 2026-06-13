WORKSPACE_TEMPLATES = [
    {
        "key": "software",
        "name": "Software Team",
        "description": "Sprint-based engineering workflow with bug tracking and feature planning.",
        "icon": "💻",
        "projects": [
            {"name": "Sprint Board", "board_type": "scrum"},
            {"name": "Bug Tracker", "board_type": "list"},
        ],
    },
    {
        "key": "startup",
        "name": "Startup",
        "description": "Move fast across product, engineering and growth with a unified board.",
        "icon": "🚀",
        "projects": [
            {"name": "Roadmap", "board_type": "timeline"},
            {"name": "Sprint", "board_type": "scrum"},
        ],
    },
    {
        "key": "design",
        "name": "Design Studio",
        "description": "Creative project tracking from brief to delivery.",
        "icon": "🎨",
        "projects": [
            {"name": "Active Projects", "board_type": "kanban"},
            {"name": "Client Requests", "board_type": "list"},
        ],
    },
    {
        "key": "marketing",
        "name": "Marketing Agency",
        "description": "Campaign pipeline, content calendar and asset management.",
        "icon": "📢",
        "projects": [
            {"name": "Campaigns", "board_type": "kanban"},
            {"name": "Content Calendar", "board_type": "calendar"},
        ],
    },
    {
        "key": "education",
        "name": "Education",
        "description": "Course planning, assignments and student project tracking.",
        "icon": "🎓",
        "projects": [
            {"name": "Curriculum", "board_type": "list"},
            {"name": "Projects", "board_type": "kanban"},
        ],
    },
    {
        "key": "operations",
        "name": "Operations",
        "description": "Process management, SOPs and cross-team coordination.",
        "icon": "⚙️",
        "projects": [
            {"name": "Processes", "board_type": "list"},
            {"name": "OKRs", "board_type": "kanban"},
        ],
    },
]

WEBHOOK_EVENTS = [
    "task.created",
    "task.updated",
    "task.deleted",
    "task.assigned",
    "task.commented",
    "task.completed",
    "sprint.started",
    "sprint.completed",
    "member.added",
    "member.removed",
]
