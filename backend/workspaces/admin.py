from django.contrib import admin
from .models import Workspace, WorkspaceMember, WorkspaceInvite


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "owner", "created_at"]
    search_fields = ["name", "slug"]


@admin.register(WorkspaceMember)
class WorkspaceMemberAdmin(admin.ModelAdmin):
    list_display = ["user", "workspace", "role", "joined_at"]
    list_filter = ["role"]


@admin.register(WorkspaceInvite)
class WorkspaceInviteAdmin(admin.ModelAdmin):
    list_display = ["email", "workspace", "role", "status", "created_at"]
    list_filter = ["status"]
