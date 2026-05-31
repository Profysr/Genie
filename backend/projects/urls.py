from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView,
    TaskStatusListCreateView,
    TaskListCreateView, TaskDetailView, TaskMoveView,
    SubTaskListCreateView, SubTaskDetailView,
    TaskCommentListCreateView, TaskCommentDetailView,
)

urlpatterns = [
    # Projects
    path("workspaces/<slug:workspace_slug>/projects/", ProjectListCreateView.as_view()),
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/", ProjectDetailView.as_view()),

    # Kanban columns
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/statuses/", TaskStatusListCreateView.as_view()),

    # Tasks
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/tasks/", TaskListCreateView.as_view()),
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/tasks/<uuid:task_id>/", TaskDetailView.as_view()),
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/tasks/<uuid:task_id>/move/", TaskMoveView.as_view()),

    # Subtasks
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/tasks/<uuid:task_id>/subtasks/", SubTaskListCreateView.as_view()),
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/tasks/<uuid:task_id>/subtasks/<uuid:subtask_id>/", SubTaskDetailView.as_view()),

    # Comments
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/tasks/<uuid:task_id>/comments/", TaskCommentListCreateView.as_view()),
    path("workspaces/<slug:workspace_slug>/projects/<uuid:project_id>/tasks/<uuid:task_id>/comments/<uuid:comment_id>/", TaskCommentDetailView.as_view()),
]
