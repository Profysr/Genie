from django.urls import path
from .views import (
    WorkspaceListCreateView, WorkspaceDetailView,
    WorkspaceMemberListView, WorkspaceMemberDetailView,
    InviteMemberView, AcceptInviteView,
)

urlpatterns = [
    path("workspaces/", WorkspaceListCreateView.as_view(), name="workspace-list"),
    path("workspaces/<slug:slug>/", WorkspaceDetailView.as_view(), name="workspace-detail"),
    path("workspaces/<slug:slug>/members/", WorkspaceMemberListView.as_view(), name="workspace-members"),
    path("workspaces/<slug:slug>/members/<uuid:member_id>/", WorkspaceMemberDetailView.as_view(), name="workspace-member-detail"),
    path("workspaces/<slug:slug>/invite/", InviteMemberView.as_view(), name="workspace-invite"),
    path("invites/<uuid:token>/accept/", AcceptInviteView.as_view(), name="invite-accept"),
]
