from django.contrib import admin
from .models import Project, TaskStatus, Task, SubTask, TaskComment


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "workspace", "status", "created_by", "created_at"]
    list_filter = ["status"]
    search_fields = ["name"]


@admin.register(TaskStatus)
class TaskStatusAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "color", "order"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "status", "priority", "assignee", "due_date"]
    list_filter = ["priority"]
    search_fields = ["title"]


@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = ["title", "task", "is_done"]


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ["task", "author", "created_at"]
