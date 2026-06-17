from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from ..models import Board, Task
from ..serializers import TaskSearchSerializer, BoardSearchSerializer
from workspaces.models import WorkspaceMember
from .helpers import _parse_pk

_TASK_LIMIT_MAX = 50
_TASK_LIMIT_DEFAULT = 20
_BOARD_LIMIT = 5


# ── Search helpers ─────────────────────────────────────────────────────────────

def _get_user_workspace_ids(user):
    return WorkspaceMember.objects.filter(user=user).values_list(
        "workspace_id", flat=True
    )


def _parse_search_params(query_params):
    try:
        limit = min(int(query_params.get("limit", _TASK_LIMIT_DEFAULT)), _TASK_LIMIT_MAX)
    except (ValueError, TypeError):
        limit = _TASK_LIMIT_DEFAULT
    raw_end = query_params.get("end_date", "").strip()
    end_date = raw_end or timezone.now().date().isoformat()
    return {
        "q": query_params.get("q", "").strip(),
        "task_type": query_params.get("task_type", "").strip(),
        "assignee": query_params.get("assignee", "").strip(),
        "priority": query_params.get("priority", "").strip(),
        "status": query_params.get("status", "").strip(),
        "board_id": query_params.get("board_id", "").strip(),
        "sprint_id": query_params.get("sprint_id", "").strip(),
        "end_date": end_date,
        "overdue": query_params.get("overdue", "").lower() == "true",
        "today_only": query_params.get("today", "").lower() == "true",
        "limit": limit,
    }


def _has_any_filter(p):
    return bool(
        len(p["q"]) >= 2
        or p["task_type"]
        or p["assignee"]
        or p["priority"]
        or p["status"]
        or p["board_id"]
        or p["sprint_id"]
        or p["overdue"]
        or p["today_only"]
    )


def _apply_task_search_filters(qs, p):
    if len(p["q"]) >= 2:
        qs = qs.filter(
            Q(title__icontains=p["q"]) | Q(description__icontains=p["q"])
        )
    if p["task_type"]:
        qs = qs.filter(task_type__iexact=p["task_type"])
    if p["assignee"]:
        qs = qs.filter(
            Q(assignee__full_name__icontains=p["assignee"])
            | Q(assignee__email__icontains=p["assignee"])
        )
    if p["priority"]:
        qs = qs.filter(priority__iexact=p["priority"])
    if p["status"]:
        qs = qs.filter(status__name__icontains=p["status"])
    if p["board_id"]:
        qs = qs.filter(board_id=_parse_pk(p["board_id"]))
    if p["sprint_id"]:
        qs = qs.filter(sprint_id=_parse_pk(p["sprint_id"]))
    if p["end_date"]:
        qs = qs.filter(Q(due_date__lte=p["end_date"]) | Q(due_date__isnull=True))
    if p["overdue"]:
        today = timezone.now().date()
        qs = qs.filter(due_date__lt=today, status__is_done=False)
    if p["today_only"]:
        qs = qs.filter(due_date=timezone.now().date())
    return qs


def _search_boards(workspace_ids, q):
    if len(q) < 2:
        return []
    return (
        Board.objects.filter(workspace_id__in=workspace_ids, name__icontains=q)
        .select_related("workspace")[:_BOARD_LIMIT]
    )


# ── Global Search ──────────────────────────────────────────────────────────────

class GlobalSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        p = _parse_search_params(request.query_params)

        if not _has_any_filter(p):
            return Response({"tasks": [], "boards": []})

        workspace_ids = _get_user_workspace_ids(request.user)

        # Start with every task the user can see (scoped to their workspaces),then narrow down via the parsed filters (text, priority, assignee, etc.).
        # The slice at the end is applied after all filters so the DB only returns the final N rows instead of fetching everything first.
        tasks = Task.objects.filter(
            board__workspace_id__in=workspace_ids,
        ).select_related("board__workspace", "status", "assignee")

        tasks = _apply_task_search_filters(tasks, p)[: p["limit"]]

        return Response(
            {
                "tasks": TaskSearchSerializer(tasks, many=True).data,
                "boards": BoardSearchSerializer(_search_boards(workspace_ids, p["q"]), many=True).data,
            }
        )
