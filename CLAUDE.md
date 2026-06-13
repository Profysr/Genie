# JCN Codebase Map

## Stack
- **Backend**: Django + DRF, Celery (Redis broker), Django Channels (WebSockets)
- **Frontend**: React + Vite (run locally, not in Docker)
- **Docker**: `db` (Postgres 16), `redis`, `backend`, `celery` workers

---

## Backend Apps

### `accounts`
**Owns**: User authentication, user profile preferences.
- `User` — auth model (email, full_name, avatar, can_create_workspace). No UI prefs.
- `UserProfile` — OneToOne with User. Owns theme, accent_color, density_mode. Auto-created via `post_save` signal on User creation.
- `MeView` — `GET/PATCH /api/users/me/` — retrieves and updates the current user + their profile fields (flat API via `source="profile.*"`).
- `UserSerializer` — full user serializer (used for `/me/` endpoint only).
- `MiniUserSerializer` — read-only (id, email, full_name). Used everywhere else a user is embedded.

### `workspaces`
**Owns**: Workspaces, members, invites, notifications, inbox, API keys, webhooks, import jobs, onboarding.

**Models**:
- `Workspace` — top-level container (name, slug, logo, owner FK).
- `WorkspaceMember` — User ↔ Workspace with role (admin/member/viewer).
- `WorkspaceInvite` — pending email invites with token + status.
- `Notification` — in-app bell notifications (actor, verb, meta JSON).
- `InboxItem` — persistent inbox rows per user event. Actor fields are denormalized (actor_id, actor_name) to avoid joins on list load.
- `WorkspaceAPIKey` — hashed long-lived API keys scoped to a workspace. Raw key shown once at creation.
- `Webhook` — outbound signed webhooks. `WebhookDelivery` logs every attempt.
- `ImportJob` — tracks a file import from Jira/ClickUp/CSV etc. Celery task `run_import` does the actual work.
- `OnboardingState` — wizard/checklist state per workspace (per-user dismissal in JSON list).

**Key views**:
- `WorkspaceListCreateView` — `GET/POST /api/workspaces/`
- `WorkspaceMemberDetailView` — `PATCH/DELETE /api/workspaces/:slug/members/:id/`
- `WorkspaceInviteCancelView` — `DELETE /api/workspaces/:slug/invites/:token/`
- `NotificationListView` / `NotificationMarkReadView` — `/api/notifications/`
- `InboxListView`, `InboxItemUpdateView`, `InboxBulkUpdateView`, `InboxUnreadCountView` — `/api/inbox/`
- `APIKeyListCreateView`, `APIKeyDetailView` — `/api/workspaces/:slug/api-keys/`
- `WebhookListCreateView`, `WebhookDetailView`, `WebhookTestView`, `WebhookDeliveryListView` — `/api/workspaces/:slug/webhooks/`
- `ImportJobListCreateView`, `ImportJobDetailView`, `ImportJobRunView`, `ImportJobRollbackView` — `/api/workspaces/:slug/import/jobs/`
- `OnboardingStateView` — `/api/workspaces/:slug/onboarding/` — only workspace owner sees onboarding.

**Helpers**:
- `_is_workspace_admin(workspace, user)` — boolean, used in member/invite views.
- `_require_admin(workspace, user)` — raises PermissionDenied, used in API key/webhook views.
- `workspaces/constants.py` — `WORKSPACE_TEMPLATES`, `WEBHOOK_EVENTS`.

**Tasks** (`workspaces/tasks.py`):
- `deliver_webhook(webhook_id, event, payload)` — Celery. Retries: 5 min → 30 min. Max 3 attempts.
- `run_import(job_id)` — Celery. Streams progress via WebSocket `import.progress` events.

### `projects`
**Owns**: Projects, boards, tasks, sprints, task statuses, labels, comments.
- `DEFAULT_TASK_STATUSES` — constant tuple (Backlog → In Progress → In Review → Done). Used by `WorkspaceTemplateApplyView` and import runner.
- Task events fire `_fire_webhooks()` which calls `integrations.services.fanout_notification()`.

### `integrations`
**Owns**: Teams + Google Chat outbound notifications, channel routing rules.
- `TeamsIntegration` / `GoogleChatIntegration` — one webhook URL per workspace. Upsert via `PUT`, serializer `create()` uses `update_or_create()`.
- `IntegrationChannelMapping` — per-project routing rules on top of a workspace integration. `project=None` = workspace-wide fallback. `enabled_events=[]` = all events.
- `fanout_notification(workspace, verb, task, actor)` — called from `projects.views`. Fans out to all active mappings. Never raises.
- `format_teams_card()` / `format_google_chat_card()` — build platform-specific payloads.

### `core`
**Owns**: Django settings, URL root, Celery config, ASGI setup.
- Celery app: `core.celery`. No Beat scheduler needed (retries use countdown, not periodic tasks).

---

## Cross-App Wiring

```
User registers
  → post_save signal → UserProfile created

Task event (create/assign/complete/etc.) in projects/views.py
  → _fire_webhooks() → workspaces.tasks.deliver_webhook.delay()   [outbound webhooks]
  → integrations.services.fanout_notification()                    [Teams / Google Chat]
  → Notification.objects.create() + InboxItem.objects.create()     [in-app inbox]

Import file upload → ImportJob created → run_import.delay()
  → channels WebSocket group_send("workspace_{slug}") → frontend progress bar
```

---

## Conventions
- URLs use `workspace_slug` kwarg for workspace-scoped endpoints, `slug` for workspace detail/member endpoints.
- Admin check: `_is_workspace_admin()` for member/invite ops; `_require_admin()` for API keys/webhooks.
- Serializer `create()` always uses `update_or_create()` for upsertable models — no separate `update()` needed.
- API keys: hash stored, raw key returned once. Soft-delete via `is_active=False`.
- Webhook signing: HMAC-SHA256 over `"{timestamp}.{body}"`.

---

## Known Tech Debt
- `WorkspaceMember.Role` is simple (admin/member/viewer) — RBAC is v2+.
- `InboxItem` actor fields are denormalized strings — acceptable for v1 inbox performance.
- Workspace templates are static in `constants.py` — a `WorkspaceTemplate` model is a future improvement.

---

## Scaling & Performance — Non-Negotiable Rules

This app is built to scale to millions of users. Every backend change must follow these rules without exception.

### UUIDv7 IDs
- **All model PKs use `UUIDv7Field` from `core.fields`** — never `models.UUIDField(default=uuid.uuid4)`.
- UUIDv7 is time-sortable: new rows insert at the end of the B-tree (no fragmentation). UUID4 is random and causes B-tree page splits at scale.
- Non-PK token fields (e.g. `WorkspaceInvite.token`, `Form.token`, `GuestToken.token`) stay as UUID4 — they are opaque secrets, not sortable IDs.
- Sort records by `id` (UUIDv7) instead of `created_at` where both are equivalent — one fewer column in the index.

### No N+1 Queries
- **Always use `select_related` for ForeignKey/OneToOne** and **`prefetch_related` for ManyToMany/reverse FKs** before iterating.
- Never access a related object inside a loop without prefetching first.
- Use `values()` or `values_list()` when you only need a subset of columns.
- In DRF serializers, override `get_queryset()` in the view (not the serializer) to attach prefetches.

### Database Indexes
- **Every composite query pattern gets a composite index** in the model's `Meta.indexes`.
- Single-column FK indexes are auto-created by Django — do not duplicate them.
- Add `db_index=True` to any non-FK CharField/IntegerField that appears in `.filter()` or `.order_by()` at query-hot paths.
- Index names follow the pattern: `<model_abbr>_<fields>_idx` (e.g. `task_project_status_idx`).

### General
- Prefer `QuerySet.update()` over fetching + saving objects in loops.
- Use `bulk_create()` / `bulk_update()` for multi-row writes.
- Never call `.count()` inside a loop — aggregate in one query.
