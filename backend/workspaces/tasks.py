# Celery tasks for the workspaces app.
#
# What is Celery?
#   Celery is a background task queue. Instead of running slow or unreliable work
#   (like making an outbound HTTP request) inside a Django view — which would make the user wait — you hand the job to Celery and return a response immediately.
#   Celery uses Redis as a "broker": Django drops a message into Redis, and a separate Celery worker process picks it up and executes it.

# How deliver_webhook is triggered:
#   Two places call deliver_webhook.delay(...):
#     1. WebhookTestView (views.py) — when the user clicks "Test webhook" in the UI
#     2. _fire_webhooks()  (projects/views.py) — after real task/sprint events happen
#
#   .delay() is the Celery method that queues the task asynchronously.
#   The Django view returns immediately; the worker runs this function in the background.

# Retry strategy:
#   attempt 1 → runs immediately
#   attempt 2 → 5 minutes later   (if attempt 1 failed)
#   attempt 3 → 30 minutes later  (if attempt 2 failed)
#   After 3 failures the task is abandoned and the delivery is logged as failed.

import hashlib
import hmac
import json
import logging
import time

import requests
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.utils import timezone
from .models import Webhook, WebhookDelivery

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def deliver_webhook(self, webhook_id, event, payload_dict):
    """
    Send a signed webhook payload to a registered URL and log the result.
    bind=True gives us access to `self` so we can read retry count and call self.retry().
    """
    attempt = (self.request.retries or 0) + 1
    logger.info(
        "[webhook] Starting delivery — webhook_id=%s event=%s attempt=%d",
        webhook_id,
        event,
        attempt,
    )

    # Bail out silently if the webhook was deleted or disabled since it was queued
    try:
        webhook = Webhook.objects.get(id=webhook_id, is_active=True)
    except Webhook.DoesNotExist:
        logger.warning(
            "[webhook] Skipping — webhook %s not found or inactive", webhook_id
        )
        return

    # Serialize payload to JSON
    body = json.dumps(payload_dict, default=str)

    # Build the HMAC-SHA256 signature so the receiver can verify the request is genuine.
    # Format: sha256=HMAC(secret, "{timestamp}.{body}")
    # The receiver recomputes this using their stored secret and compares.
    timestamp = str(int(time.time()))
    sig_input = f"{timestamp}.{body}"
    signature = hmac.new(
        webhook.secret.encode(), sig_input.encode(), hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-JCN-Event": event,  # e.g. "task.created"
        "X-JCN-Timestamp": timestamp,  # Unix timestamp — receiver can reject stale requests
        "X-JCN-Signature": f"sha256={signature}",  # HMAC signature for verification
        "X-JCN-Delivery": str(
            self.request.id or "unknown"
        ),  # Celery task ID for tracing
    }

    logger.debug(
        "[webhook] POST %s  headers=%s  body_len=%d",
        webhook.url,
        list(headers.keys()),
        len(body),
    )

    start = time.time()
    resp_code = None
    resp_body = ""
    success = False

    try:
        resp = requests.post(webhook.url, data=body, headers=headers, timeout=10)
        resp_code = resp.status_code
        resp_body = resp.text[:4000]
        success = 200 <= resp_code < 300
        logger.info(
            "[webhook] Response %d from %s (attempt %d)",
            resp_code,
            webhook.url,
            attempt,
        )
    except Exception as exc:
        resp_body = str(exc)[:500]
        logger.warning(
            "[webhook] Request failed (attempt %d): %s — %s", attempt, webhook.url, exc
        )

    duration_ms = int((time.time() - start) * 1000)

    # Always log the attempt — this is what the delivery history UI reads
    WebhookDelivery.objects.create(
        webhook=webhook,
        event=event,
        request_body=body[:8000],
        response_code=resp_code,
        response_body=resp_body,
        duration_ms=duration_ms,
        success=success,
        attempt=attempt,
    )

    if success:
        logger.info(
            "[webhook] Delivered successfully — webhook_id=%s event=%s duration=%dms",
            webhook_id,
            event,
            duration_ms,
        )
    elif attempt < 3:
        # Exponential backoff: wait longer on each retry to avoid hammering a struggling server
        countdown = 300 if attempt == 1 else 1800  # 5 min → 30 min
        logger.warning(
            "[webhook] Delivery failed — scheduling retry %d in %ds",
            attempt + 1,
            countdown,
        )
        raise self.retry(countdown=countdown)
    else:
        logger.error(
            "[webhook] All 3 attempts failed — giving up on webhook_id=%s event=%s",
            webhook_id,
            event,
        )


# ── v4.6.0 — Import Runner ────────────────────────────────────────────────────


def _broadcast_import(
    workspace_slug,
    job_id,
    status,
    progress_pct,
    imported=0,
    skipped=0,
    total=0,
    error=None,
):
    """Push an import.progress event to the workspace WebSocket group."""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"workspace_{workspace_slug}",
            {
                "type": "workspace.event",
                "data": {
                    "type": "import.progress",
                    "payload": {
                        "job_id": str(job_id),
                        "status": status,
                        "progress_pct": progress_pct,
                        "imported": imported,
                        "skipped": skipped,
                        "total": total,
                        "error": error,
                    },
                },
            },
        )
    except Exception as exc:
        logger.warning("import broadcast failed: %s", exc)


@shared_task(bind=True)
def run_import(self, job_id):
    """
    Execute an ImportJob:
    1. Walk parsed_rows applying field_mapping.
    2. Create Task objects, resolving status / assignee by name/email.
    3. Broadcast progress every 5% via WebSocket.
    4. Mark job complete / failed.
    """
    from workspaces.models import ImportJob
    from projects.models import Project, Task, TaskStatus, Label
    from .importers.base import ParsedTask
    from django.contrib.auth import get_user_model

    User = get_user_model()

    try:
        job = ImportJob.objects.select_related("workspace", "created_by").get(id=job_id)
    except ImportJob.DoesNotExist:
        logger.error("run_import: job %s not found", job_id)
        return

    ws_slug = job.workspace.slug
    job.status = ImportJob.Status.IMPORTING
    job.save(update_fields=["status"])
    _broadcast_import(ws_slug, job_id, "importing", 0)

    project, _ = Project.objects.get_or_create(
        workspace=job.workspace,
        name=f"Imported from {job.get_source_display()}",
        defaults={"created_by": job.created_by},
    )

    default_statuses = [
        ("Backlog", "#94a3b8", 0, False),
        ("In Progress", "#6366f1", 1, False),
        ("In Review", "#f59e0b", 2, False),
        ("Done", "#22c55e", 3, True),
    ]
    
    existing_names = set(project.statuses.values_list("name", flat=True))
    for name, color, order, is_done in default_statuses:
        if name not in existing_names:
            TaskStatus.objects.create(
                project=project, name=name, color=color, order=order, is_done=is_done
            )

    status_map = {s.name.lower(): s for s in project.statuses.all()}
    user_map = {
        u.email.lower(): u
        for u in User.objects.filter(workspace_memberships__workspace=job.workspace)
    }

    rows = job.parsed_rows
    total = len(rows)
    imported_ids = []
    skipped = 0
    errors = []
    last_pct = -1

    job.total_count = total
    job.save(update_fields=["total_count"])

    for i, row_dict in enumerate(rows):
        try:
            pt = ParsedTask.from_dict(row_dict)

            if (
                pt.external_id
                and Task.objects.filter(project=project, title=pt.title).exists()
            ):
                skipped += 1
                continue

            status_obj = (
                status_map.get(pt.status_name.lower())
                or status_map.get("backlog")
                or project.statuses.order_by("order").first()
            )
            assignee = user_map.get((pt.assignee_email or "").lower())

            task = Task.objects.create(
                project=project,
                title=pt.title,
                description=pt.description,
                status=status_obj,
                priority=pt.priority,
                task_type=pt.task_type,
                assignee=assignee,
                due_date=pt.due_date or None,
                start_date=pt.start_date or None,
                estimate_hours=pt.estimate_hours,
                created_by=job.created_by,
            )

            for label_name in pt.labels:
                label, _ = Label.objects.get_or_create(
                    project=project,
                    name=label_name[:50],
                    defaults={"color": "#94a3b8"},
                )
                task.labels.add(label)

            imported_ids.append(str(task.id))

        except Exception as exc:
            errors.append({"row": i, "error": str(exc)[:200]})
            skipped += 1
            logger.warning("import row %d failed: %s", i, exc)

        pct = int((i + 1) / total * 100) if total else 100
        if pct >= last_pct + 5:
            last_pct = pct
            job.progress_pct = pct
            job.imported_count = len(imported_ids)
            job.skipped_count = skipped
            job.save(update_fields=["progress_pct", "imported_count", "skipped_count"])
            _broadcast_import(
                ws_slug,
                job_id,
                "importing",
                pct,
                imported=len(imported_ids),
                skipped=skipped,
                total=total,
            )

    job.status = ImportJob.Status.COMPLETE
    job.progress_pct = 100
    job.imported_count = len(imported_ids)
    job.skipped_count = skipped
    job.imported_task_ids = imported_ids
    job.error_log = errors
    job.completed_at = timezone.now()
    job.save()

    _broadcast_import(
        ws_slug,
        job_id,
        "complete",
        100,
        imported=len(imported_ids),
        skipped=skipped,
        total=total,
    )
