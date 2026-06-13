import logging
import requests
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from core.fields import parse_id
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


# ==============================================================================
# ── SHARED INTEGRATION UTILITIES ──────────────────────────────────────────────
# ==============================================================================


def _parse_pk(value):
    """Safely handles custom prefixed IDs or native UUID strings."""
    try:
        return parse_id(value)
    except (ValueError, AttributeError, TypeError):
        return value


def _get_workspace(workspace_id, user):
    """
    Fetches a workspace by its parsed ID and verifies user access.
    Raises 404 if the workspace doesn't exist, 403 if they are not a member.
    """
    ws = get_object_or_404(Workspace, id=_parse_pk(workspace_id))
    if not ws.members.filter(user=user).exists():
        raise PermissionDenied("You do not have permission to access this workspace.")
    return ws


def _ensure_default_mapping(ws, platform):
    """Creates a fallback workspace-wide mapping if it does not already exist."""
    IntegrationChannelMapping.objects.get_or_create(
        workspace=ws,
        board=None,
        platform=platform,
        defaults={
            "notification_format": "detailed",
            "enabled_events": ALL_EVENTS,
            "is_active": True,
        },
    )


def _test_webhook(url, payload):
    """Fires a safe, structured outbound network request to check a remote webhook."""
    try:
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code >= 400:
            return False, Response(
                {"error": f"Webhook returned status code {resp.status_code}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
    except Exception as exc:
        return False, Response(
            {"error": str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return True, None


def _get_teams_data_or_none(ws):
    """Safely extracts serializable MS Teams integration data or None."""
    try:
        return TeamsIntegrationSerializer(ws.teams_integration).data
    except TeamsIntegration.DoesNotExist:
        return None


def _get_gchat_data_or_none(ws):
    """Safely extracts serializable Google Chat integration data or None."""
    try:
        return GoogleChatIntegrationSerializer(ws.google_chat_integration).data
    except GoogleChatIntegration.DoesNotExist:
        return None


# ==============================================================================
# ── INTEGRATION MONITORING & STATUS ───────────────────────────────────────────
# ==============================================================================


class IntegrationStatusView(APIView):
    """Returns the current workspace connection state across all supported external ecosystems."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        return Response(
            {
                "teams": _get_teams_data_or_none(ws),
                "google_chat": _get_gchat_data_or_none(ws),
            },
            status=status.HTTP_200_OK,
        )


# ==============================================================================
# ── MICROSOFT TEAMS INTEGRATION ───────────────────────────────────────────────
# ==============================================================================


class TeamsIntegrationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        return Response(_get_teams_data_or_none(ws), status=status.HTTP_200_OK)

    def put(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        s = TeamsIntegrationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        integration = s.save(workspace=ws)

        _ensure_default_mapping(ws, IntegrationChannelMapping.Platform.TEAMS)
        return Response(
            TeamsIntegrationSerializer(integration).data, status=status.HTTP_200_OK
        )

    def delete(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        TeamsIntegration.objects.filter(workspace=ws).delete()
        IntegrationChannelMapping.objects.filter(
            workspace=ws, platform=IntegrationChannelMapping.Platform.TEAMS
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamsTestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        try:
            integration = ws.teams_integration
        except TeamsIntegration.DoesNotExist:
            return Response(
                {"error": "Teams is not connected yet."},
                status=status.HTTP_404_NOT_FOUND,
            )

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


# ==============================================================================
# ── GOOGLE CHAT INTEGRATION ───────────────────────────────────────────────────
# ==============================================================================


class GoogleChatIntegrationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        return Response(_get_gchat_data_or_none(ws), status=status.HTTP_200_OK)

    def put(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        s = GoogleChatIntegrationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        integration = s.save(workspace=ws)

        _ensure_default_mapping(ws, IntegrationChannelMapping.Platform.GOOGLE_CHAT)
        return Response(
            GoogleChatIntegrationSerializer(integration).data, status=status.HTTP_200_OK
        )

    def delete(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        GoogleChatIntegration.objects.filter(workspace=ws).delete()
        IntegrationChannelMapping.objects.filter(
            workspace=ws, platform=IntegrationChannelMapping.Platform.GOOGLE_CHAT
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoogleChatTestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
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
                f"Notifications will appear here for task events you configure."
            )
        }
        ok, err = _test_webhook(integration.webhook_url, payload)
        return Response({"ok": True}, status=status.HTTP_200_OK) if ok else err


# ==============================================================================
# ── GRANULAR ROUTING & CHANNEL MAPPINGS ───────────────────────────────────────
# ==============================================================================


class ChannelMappingListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        qs = IntegrationChannelMapping.objects.filter(workspace=ws).select_related(
            "board"
        )

        platform = request.query_params.get("platform")
        if platform:
            qs = qs.filter(platform=platform)

        return Response(
            IntegrationChannelMappingSerializer(qs, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, workspace_id):
        ws = _get_workspace(workspace_id, request.user)
        s = IntegrationChannelMappingSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        return Response(
            IntegrationChannelMappingSerializer(s.save(workspace=ws)).data,
            status=status.HTTP_201_CREATED,
        )


class ChannelMappingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_mapping(self, workspace_id, mapping_id, user):
        ws = _get_workspace(workspace_id, user)
        return get_object_or_404(
            IntegrationChannelMapping, id=_parse_pk(mapping_id), workspace=ws
        )

    def patch(self, request, workspace_id, mapping_id):
        mapping = self._get_mapping(workspace_id, mapping_id, request.user)
        s = IntegrationChannelMappingSerializer(
            mapping, data=request.data, partial=True
        )
        s.is_valid(raise_exception=True)
        updated = s.save()
        return Response(
            IntegrationChannelMappingSerializer(updated).data, status=status.HTTP_200_OK
        )

    def delete(self, request, workspace_id, mapping_id):
        self._get_mapping(workspace_id, mapping_id, request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
