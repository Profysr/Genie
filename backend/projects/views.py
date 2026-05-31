from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from workspaces.models import Workspace, WorkspaceMember
from .models import Project, TaskStatus, Task, SubTask, TaskComment, TaskActivity
from .serializers import (
    ProjectSerializer, TaskStatusSerializer,
    TaskSerializer, TaskDetailSerializer,
    SubTaskSerializer, TaskCommentSerializer, TaskActivitySerializer,
)


def get_workspace_for_user(slug, user):
    return get_object_or_404(Workspace, slug=slug, members__user=user)


def broadcast(workspace_slug, event_type, data):
    """Push a real-time event to all WebSocket clients in this workspace."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"workspace_{workspace_slug}",
        {"type": "workspace.event", "data": {"type": event_type, "payload": data}},
    )


def log_activity(task, actor, verb, meta=None):
    TaskActivity.objects.create(task=task, actor=actor, verb=verb, meta=meta or {})


# ── Projects ──────────────────────────────────────────────────────────────────

class ProjectListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_slug):
        workspace = get_workspace_for_user(workspace_slug, request.user)
        projects = workspace.projects.all()
        return Response(ProjectSerializer(projects, many=True, context={"request": request}).data)

    def post(self, request, workspace_slug):
        workspace = get_workspace_for_user(workspace_slug, request.user)
        serializer = ProjectSerializer(data=request.data, context={"request": request, "workspace": workspace})
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(ProjectSerializer(project, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_project(self, workspace_slug, project_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        return get_object_or_404(Project, id=project_id, workspace=workspace)

    def get(self, request, workspace_slug, project_id):
        project = self.get_project(workspace_slug, project_id, request.user)
        return Response(ProjectSerializer(project, context={"request": request}).data)

    def patch(self, request, workspace_slug, project_id):
        project = self.get_project(workspace_slug, project_id, request.user)
        serializer = ProjectSerializer(project, data=request.data, partial=True, context={"request": request, "workspace": project.workspace})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, workspace_slug, project_id):
        project = self.get_project(workspace_slug, project_id, request.user)
        is_admin = WorkspaceMember.objects.filter(
            workspace=project.workspace, user=request.user, role=WorkspaceMember.Role.ADMIN
        ).exists()
        if not is_admin:
            return Response({"detail": "Only workspace admins can delete projects."}, status=status.HTTP_403_FORBIDDEN)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Task Statuses (Kanban columns) ────────────────────────────────────────────

class TaskStatusListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_project(self, workspace_slug, project_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        return get_object_or_404(Project, id=project_id, workspace=workspace)

    def get(self, request, workspace_slug, project_id):
        project = self.get_project(workspace_slug, project_id, request.user)
        return Response(TaskStatusSerializer(project.statuses.all(), many=True).data)

    def post(self, request, workspace_slug, project_id):
        project = self.get_project(workspace_slug, project_id, request.user)
        serializer = TaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── Tasks ─────────────────────────────────────────────────────────────────────

class TaskListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_project(self, workspace_slug, project_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        return get_object_or_404(Project, id=project_id, workspace=workspace)

    def get(self, request, workspace_slug, project_id):
        project = self.get_project(workspace_slug, project_id, request.user)
        tasks = project.tasks.select_related("status", "assignee", "created_by").prefetch_related("subtasks", "comments")
        return Response(TaskSerializer(tasks, many=True, context={"request": request}).data)

    def post(self, request, workspace_slug, project_id):
        project = self.get_project(workspace_slug, project_id, request.user)
        serializer = TaskSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        task = serializer.save(project=project)
        log_activity(task, request.user, TaskActivity.Verb.CREATED)
        data = TaskSerializer(task, context={"request": request}).data
        broadcast(workspace_slug, "task.created", data)
        return Response(data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_task(self, workspace_slug, project_id, task_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        project = get_object_or_404(Project, id=project_id, workspace=workspace)
        return get_object_or_404(
            Task.objects.select_related("status", "assignee", "created_by").prefetch_related("subtasks", "comments__author", "activities__actor"),
            id=task_id, project=project,
        )

    def get(self, request, workspace_slug, project_id, task_id):
        task = self.get_task(workspace_slug, project_id, task_id, request.user)
        return Response(TaskDetailSerializer(task, context={"request": request}).data)

    def patch(self, request, workspace_slug, project_id, task_id):
        task = self.get_task(workspace_slug, project_id, task_id, request.user)
        old_status = task.status
        old_priority = task.priority
        old_assignee = task.assignee

        serializer = TaskSerializer(task, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        task.refresh_from_db()

        # Log what actually changed
        if "status_id" in request.data and task.status != old_status:
            log_activity(task, request.user, TaskActivity.Verb.STATUS, {
                "from": old_status.name if old_status else None,
                "to": task.status.name if task.status else None,
            })
        elif "priority" in request.data and task.priority != old_priority:
            log_activity(task, request.user, TaskActivity.Verb.PRIORITY, {
                "from": old_priority, "to": task.priority,
            })
        elif "assignee_id" in request.data and task.assignee != old_assignee:
            log_activity(task, request.user, TaskActivity.Verb.ASSIGNED, {
                "to": task.assignee.full_name if task.assignee else None,
            })
        else:
            log_activity(task, request.user, TaskActivity.Verb.UPDATED)

        data = TaskSerializer(task, context={"request": request}).data
        broadcast(workspace_slug, "task.updated", data)
        return Response(data)

    def delete(self, request, workspace_slug, project_id, task_id):
        task = self.get_task(workspace_slug, project_id, task_id, request.user)
        task_id_str = str(task.id)
        task.delete()
        broadcast(workspace_slug, "task.deleted", {"id": task_id_str, "project_id": str(project_id)})
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Task Move (Kanban drag & drop) ────────────────────────────────────────────

class TaskMoveView(APIView):
    """Update a task's status column and order in one atomic call."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, workspace_slug, project_id, task_id):
        workspace = get_workspace_for_user(workspace_slug, request.user)
        project = get_object_or_404(Project, id=project_id, workspace=workspace)
        task = get_object_or_404(Task, id=task_id, project=project)

        status_id = request.data.get("status_id")
        order = request.data.get("order")
        old_status = task.status

        if status_id is not None:
            task_status = get_object_or_404(TaskStatus, id=status_id, project=project)
            task.status = task_status
        if order is not None:
            task.order = order

        task.save(update_fields=["status", "order", "updated_at"])

        if task.status != old_status:
            log_activity(task, request.user, TaskActivity.Verb.STATUS, {
                "from": old_status.name if old_status else None,
                "to": task.status.name if task.status else None,
            })

        data = TaskSerializer(task, context={"request": request}).data
        broadcast(workspace_slug, "task.moved", data)
        return Response(data)


# ── Subtasks ──────────────────────────────────────────────────────────────────

class SubTaskListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_task(self, workspace_slug, project_id, task_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        project = get_object_or_404(Project, id=project_id, workspace=workspace)
        return get_object_or_404(Task, id=task_id, project=project)

    def get(self, request, workspace_slug, project_id, task_id):
        task = self.get_task(workspace_slug, project_id, task_id, request.user)
        return Response(SubTaskSerializer(task.subtasks.all(), many=True).data)

    def post(self, request, workspace_slug, project_id, task_id):
        task = self.get_task(workspace_slug, project_id, task_id, request.user)
        serializer = SubTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subtask = serializer.save(task=task)
        log_activity(task, request.user, TaskActivity.Verb.SUBTASK, {"title": subtask.title})
        return Response(SubTaskSerializer(subtask).data, status=status.HTTP_201_CREATED)


class SubTaskDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_subtask(self, workspace_slug, project_id, task_id, subtask_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        project = get_object_or_404(Project, id=project_id, workspace=workspace)
        task = get_object_or_404(Task, id=task_id, project=project)
        return get_object_or_404(SubTask, id=subtask_id, task=task)

    def patch(self, request, workspace_slug, project_id, task_id, subtask_id):
        subtask = self.get_subtask(workspace_slug, project_id, task_id, subtask_id, request.user)
        serializer = SubTaskSerializer(subtask, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, workspace_slug, project_id, task_id, subtask_id):
        subtask = self.get_subtask(workspace_slug, project_id, task_id, subtask_id, request.user)
        subtask.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Comments ──────────────────────────────────────────────────────────────────

class TaskCommentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_task(self, workspace_slug, project_id, task_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        project = get_object_or_404(Project, id=project_id, workspace=workspace)
        return get_object_or_404(Task, id=task_id, project=project)

    def get(self, request, workspace_slug, project_id, task_id):
        task = self.get_task(workspace_slug, project_id, task_id, request.user)
        return Response(TaskCommentSerializer(task.comments.select_related("author").all(), many=True, context={"request": request}).data)

    def post(self, request, workspace_slug, project_id, task_id):
        task = self.get_task(workspace_slug, project_id, task_id, request.user)
        serializer = TaskCommentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(task=task)
        log_activity(task, request.user, TaskActivity.Verb.COMMENTED)
        data = TaskCommentSerializer(comment, context={"request": request}).data
        broadcast(workspace_slug, "comment.created", {
            "task_id": str(task.id),
            "project_id": str(task.project_id),
            "comment": data,
        })
        return Response(data, status=status.HTTP_201_CREATED)


class TaskCommentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_comment(self, workspace_slug, project_id, task_id, comment_id, user):
        workspace = get_workspace_for_user(workspace_slug, user)
        project = get_object_or_404(Project, id=project_id, workspace=workspace)
        task = get_object_or_404(Task, id=task_id, project=project)
        return get_object_or_404(TaskComment, id=comment_id, task=task)

    def patch(self, request, workspace_slug, project_id, task_id, comment_id):
        comment = self.get_comment(workspace_slug, project_id, task_id, comment_id, request.user)
        if comment.author != request.user:
            return Response({"detail": "You can only edit your own comments."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TaskCommentSerializer(comment, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, workspace_slug, project_id, task_id, comment_id):
        comment = self.get_comment(workspace_slug, project_id, task_id, comment_id, request.user)
        if comment.author != request.user:
            return Response({"detail": "You can only delete your own comments."}, status=status.HTTP_403_FORBIDDEN)
        comment_id_str = str(comment.id)
        comment.delete()
        broadcast(workspace_slug, "comment.deleted", {
            "task_id": str(task_id),
            "project_id": str(project_id),
            "comment_id": comment_id_str,
        })
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Activity ──────────────────────────────────────────────────────────────────

class TaskActivityListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_slug, project_id, task_id):
        workspace = get_workspace_for_user(workspace_slug, request.user)
        project = get_object_or_404(Project, id=project_id, workspace=workspace)
        task = get_object_or_404(Task, id=task_id, project=project)
        activities = task.activities.select_related("actor").all()
        return Response(TaskActivitySerializer(activities, many=True).data)
