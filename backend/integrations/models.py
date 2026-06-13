from django.db import models
from workspaces.models import Workspace
from projects.models import Project

from core.fields import UUIDv7Field


class TeamsIntegration(models.Model):
    """
    Microsoft Teams incoming webhook per workspace.
    The user creates the webhook in Teams and pastes the URL here.
    """

    PREFIX = "tim"
    id = UUIDv7Field()
    workspace = models.OneToOneField(
        Workspace,
        on_delete=models.CASCADE,
        related_name="teams_integration",
    )
    webhook_url = models.CharField(max_length=1024)
    space_name = models.CharField(max_length=128, default="JCN")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Teams webhook → {self.workspace}"


class GoogleChatIntegration(models.Model):
    """
    Google Chat incoming webhook per workspace.
    The user creates the webhook in a Google Chat Space and pastes the URL here.
    """

    PREFIX = "gci"
    id = UUIDv7Field()
    workspace = models.OneToOneField(
        Workspace,
        on_delete=models.CASCADE,
        related_name="google_chat_integration",
    )
    webhook_url = models.CharField(max_length=1024)
    space_name = models.CharField(max_length=128, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Google Chat webhook → {self.workspace}"


class IntegrationChannelMapping(models.Model):
    """
    Per-project routing rules on top of a workspace integration.

    TeamsIntegration / GoogleChatIntegration store one webhook URL per workspace.
    This model lets you override that per project — e.g. route "Backend" project events to a different Teams channel than the workspace-wide default.
    project=None means workspace-wide fallback (created automatically on connect).

    enabled_events controls which task events fire for this mapping (empty = all).
    This is outbound-only and unrelated to the in-app Notification model.
    """

    PREFIX = "icm"

    class Platform(models.TextChoices):
        TEAMS = "teams", "Microsoft Teams"
        GOOGLE_CHAT = "google_chat", "Google Chat"

    class Format(models.TextChoices):
        # One-line summary: "Task 'Fix login bug' was completed by John"
        # Good for high-volume channels where you don't want noise.
        COMPACT = "compact", "Compact"

        # Rich card with full context: title, assignee, project, due date, and a link.
        # Better for dedicated notification channels where detail matters.
        DETAILED = "detailed", "Detailed"

    id = UUIDv7Field()
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="integration_mappings",
    )
    # null project = workspace-wide fallback mapping
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="integration_mappings",
    )
    platform = models.CharField(max_length=20, choices=Platform.choices)
    channel_name = models.CharField(max_length=128, blank=True)
    webhook_url = models.CharField(max_length=1024, blank=True)
    notification_format = models.CharField(
        max_length=10, choices=Format.choices, default=Format.DETAILED
    )
    # Which events trigger a notification — empty list = all
    enabled_events = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["workspace", "project", "platform"]]

    def __str__(self):
        proj = self.project.name if self.project else "workspace-wide"
        return f"{self.platform} mapping: {proj}"
