"""
Integration views — Teams and Google Chat webhook integrations,
channel mappings, and test/disconnect endpoints.
"""

import logging

import requests
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from workspaces.models import Workspace

from .models import GoogleChatIntegration, IntegrationChannelMapping, TeamsIntegration
from .serializers import (
    GoogleChatIntegrationSerializer,
    IntegrationChannelMappingSerializer,
    TeamsIntegrationSerializer,
)

logger = logging.getLogger(__name__)

# Events that can trigger a notification across all integrations.
ALL_EVENTS = [
    "task_created",
    "task_assigned",
    "task_commented",
    "task_completed",
    "sprint_started",
    "sprint_completed",
    "approval_requested",
]


# ── Shared helpers ─────────────────────────────────────────────────────────────
def _get_workspace(slug, user):
    """
    Fetch a workspace by slug and verify the requesting user is a member.
    Raises 404 if the workspace doesn't exist, 403 if they're not a member.
    """
    ws = get_object_or_404(Workspace, slug=slug)
    if not ws.members.filter(user=user).exists():
        raise PermissionDenied
    return ws


def _ensure_default_mapping(ws, platform):
    """
    When a platform is first connected, create a workspace-wide fallback mapping
    (project=None) so notifications fire even before any project-specific rules
    are set up. Does nothing if the mapping already exists.
    """
    IntegrationChannelMapping.objects.get_or_create(
        workspace=ws,
        project=None,
        platform=platform,
        defaults={
            "notification_format": "detailed",
            "enabled_events": ALL_EVENTS,
            "is_active": True,
        },
    )


def _test_webhook(url, payload):
    """
    Fire a test POST at a webhook URL.
    Returns a (success, error_response) tuple so callers can do:
        ok, err = _test_webhook(url, payload)
        return Response({"ok": True}) if ok else err
    """
    try:
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code >= 400:
            return False, Response(
                {"error": f"Webhook returned {resp.status_code}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
    except Exception as exc:
        return False, Response(
            {"error": str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return True, None


# ── Integration status ─────────────────────────────────────────────────────────
class IntegrationStatusView(APIView):
    """
    GET /api/workspaces/:slug/integrations/

    Returns the current connection state for every supported platform.
    A platform's value is null when it hasn't been connected yet.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)

        # Serialize each integration independently — if one isn't set up yet
        try:
            teams_data = TeamsIntegrationSerializer(ws.teams_integration).data
        except TeamsIntegration.DoesNotExist:
            teams_data = None

        try:
            gchat_data = GoogleChatIntegrationSerializer(
                ws.google_chat_integration
            ).data
        except GoogleChatIntegration.DoesNotExist:
            gchat_data = None

        return Response(
            {"teams": teams_data, "google_chat": gchat_data},
            status=status.HTTP_200_OK,
        )


# ── Teams ──────────────────────────────────────────────────────────────────────


class TeamsIntegrationView(APIView):
    """
    GET    /api/workspaces/:slug/integrations/teams/   → fetch saved config
    PUT    /api/workspaces/:slug/integrations/teams/   → save / update config
    DELETE /api/workspaces/:slug/integrations/teams/   → disconnect
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        try:
            return Response(
                TeamsIntegrationSerializer(ws.teams_integration).data,
                status=status.HTTP_200_OK,
            )
        except TeamsIntegration.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

    def put(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        s = TeamsIntegrationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        integration = s.save(workspace=ws)

        # Make sure a default workspace-wide mapping exists for routing events.
        _ensure_default_mapping(ws, IntegrationChannelMapping.Platform.TEAMS)

        return Response(
            TeamsIntegrationSerializer(integration).data,
            status=status.HTTP_200_OK,
        )

    # Remove the integration and all its channel mappings together.
    def delete(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        TeamsIntegration.objects.filter(workspace=ws).delete()
        IntegrationChannelMapping.objects.filter(
            workspace=ws, platform=IntegrationChannelMapping.Platform.TEAMS
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamsTestView(APIView):
    """
    POST /api/workspaces/:slug/integrations/teams/test/

    Sends a dummy message to the saved Teams webhook so the user can verify
    the URL is correct before relying on it for real notifications.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        try:
            integration = ws.teams_integration
        except TeamsIntegration.DoesNotExist:
            return Response(
                {"error": "Teams is not connected yet."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Teams uses the legacy MessageCard format for incoming webhooks.
        payload = {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            "themeColor": "6366f1",
            "summary": "JCN Test Message",
            "sections": [
                {
                    "activityTitle": "**JCN → Teams connected ✅**",
                    "activitySubtitle": f"Workspace: {ws.name}",
                    "activityText": "Notifications will appear here for task events you configure.",
                }
            ],
        }
        ok, err = _test_webhook(integration.webhook_url, payload)
        return Response({"ok": True}, status=status.HTTP_200_OK) if ok else err


# ── Google Chat ────────────────────────────────────────────────────────────────
class GoogleChatIntegrationView(APIView):
    """
    GET    /api/workspaces/:slug/integrations/google-chat/   → fetch saved config
    PUT    /api/workspaces/:slug/integrations/google-chat/   → save / update config
    DELETE /api/workspaces/:slug/integrations/google-chat/   → disconnect
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        try:
            return Response(
                GoogleChatIntegrationSerializer(ws.google_chat_integration).data,
                status=status.HTTP_200_OK,
            )
        except GoogleChatIntegration.DoesNotExist:
            return Response(None, status=status.HTTP_200_OK)

    def put(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        s = GoogleChatIntegrationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        integration = s.save(workspace=ws)

        _ensure_default_mapping(ws, IntegrationChannelMapping.Platform.GOOGLE_CHAT)

        return Response(
            GoogleChatIntegrationSerializer(integration).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        GoogleChatIntegration.objects.filter(workspace=ws).delete()
        IntegrationChannelMapping.objects.filter(
            workspace=ws, platform=IntegrationChannelMapping.Platform.GOOGLE_CHAT
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoogleChatTestView(APIView):
    """
    POST /api/workspaces/:slug/integrations/google-chat/test/

    Sends a dummy message to the saved Google Chat webhook URL.
    Google Chat webhooks accept a simple {"text": "..."} payload.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        try:
            integration = ws.google_chat_integration
        except GoogleChatIntegration.DoesNotExist:
            return Response(
                {"error": "Google Chat is not connected yet."},
                status=status.HTTP_404_NOT_FOUND,
            )

        payload = {
            "text": (
                f"*JCN → Google Chat connected ✅*\n"
                f"Workspace: *{ws.name}*\n"
                "Notifications will appear here for task events you configure."
            )
        }
        ok, err = _test_webhook(integration.webhook_url, payload)
        return Response({"ok": True}, status=status.HTTP_200_OK) if ok else err


# ── Channel Mappings ───────────────────────────────────────────────────────────
class ChannelMappingListCreateView(APIView):
    """
    GET  /api/workspaces/:slug/integrations/mappings/
        List all channel mappings for the workspace.
        Pass ?platform=teams or ?platform=google_chat to filter by platform.

    POST /api/workspaces/:slug/integrations/mappings/
        Create a new mapping (e.g. route a specific project to a different channel).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        qs = IntegrationChannelMapping.objects.filter(workspace=ws).select_related(
            "project"
        )

        platform = request.query_params.get("platform")
        if platform:
            qs = qs.filter(platform=platform)

        return Response(
            IntegrationChannelMappingSerializer(qs, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, workspace_slug):
        ws = _get_workspace(workspace_slug, request.user)
        s = IntegrationChannelMappingSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(
            IntegrationChannelMappingSerializer(s.save(workspace=ws)).data,
            status=status.HTTP_201_CREATED,
        )


class ChannelMappingDetailView(APIView):
    """
    PATCH  /api/workspaces/:slug/integrations/mappings/:id/
        Partially update a mapping (e.g. toggle is_active, change events).

    DELETE /api/workspaces/:slug/integrations/mappings/:id/
        Remove the mapping entirely.
    """

    permission_classes = [permissions.IsAuthenticated]

    def _get_mapping(self, workspace_slug, mapping_id, user):
        """Fetch a mapping that belongs to the workspace. Raises 404 if not found."""
        ws = _get_workspace(workspace_slug, user)
        return get_object_or_404(IntegrationChannelMapping, id=mapping_id, workspace=ws)

    def patch(self, request, workspace_slug, mapping_id):
        mapping = self._get_mapping(workspace_slug, mapping_id, request.user)
        s = IntegrationChannelMappingSerializer(
            mapping, data=request.data, partial=True
        )
        s.is_valid(raise_exception=True)
        updated = s.save()
        serialize_data = IntegrationChannelMappingSerializer(updated).data
        return Response(serialize_data, status=status.HTTP_200_OK)

    def delete(self, request, workspace_slug, mapping_id):
        self._get_mapping(workspace_slug, mapping_id, request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
