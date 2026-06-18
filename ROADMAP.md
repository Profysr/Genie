# JCN — Product Roadmap

> **Audience**: internal engineering + product. Update this file when a phase ships or scope changes.  
> **Current status**: Phases 01–05 complete. Phase 06 in planning.

---

## Vision

JCN is a management ecosystem for small businesses — not a single app, but a suite of purpose-built modules that share a common workspace, member identity, and permission layer. Each phase either deepens the core or adds a new module.

---

## Completed Phases

### Phase 01 — Workspace Foundation
Workspace creation, member invites, roles (admin/member/viewer), JWT auth, API keys.

### Phase 02 — Project Management Core
Boards, tasks, statuses (Kanban columns), priorities, assignees, labels, subtasks, comments, task activity log.

### Phase 03 — Power Features
Sprints, custom fields, saved views, task dependencies, attachments, task cloning, bulk operations, CSV/JSON export.

### Phase 04 — Knowledge & Intake
Wiki pages (with revision history), workspace documents, intake forms (public submit → creates task automatically).

### Phase 05 — Automation & Intelligence
Automation engine (trigger/condition/action rules), OKRs (objectives + key results linked to tasks), approval workflows, real-time collaboration (presence), analytics (12 computed metrics), portfolio view, global search, my-work feed.

---

## Upcoming Phases

---

### Phase 06 — Custom RBAC (Role Builder)

**Goal**: Replace hardcoded role strings with admin-defined custom roles that have granular permission flags.

**Why now**: Every downstream module (HR leave approvals, org chart management, department admin) needs a flexible permission model. Building HR on top of hardcoded admin/member/viewer creates dead-ends.

**Backend changes**:

| Model | Description |
|-------|-------------|
| `CustomRole` | `workspace` (FK), `name`, `description`, `is_system` (bool — protects built-in roles), `permissions` (JSON: `{"task.create": true, "task.delete": false, "sprint.manage": true, ...}`) |
| `RoleAssignment` | `workspace_member` (O2O), `role` (FK→CustomRole) — replaces the `role` text field on `WorkspaceMember` |

**Permission surface**:

```python
# Replaces WorkspaceMember.role text choices
has_workspace_permission(user, workspace, action)  # checks CustomRole.permissions JSON
```

**API surface**: `GET/POST /api/workspaces/{ws}/roles/`, `GET/PATCH/DELETE /api/workspaces/{ws}/roles/{id}/`

**Migration path**: create system roles (`Admin`, `Member`, `Viewer`) that mirror current behaviour, backfill `RoleAssignment` rows, then gate new permissions behind the builder.

**Frontend**: Role management UI under workspace settings → Roles tab.

---

### Phase 07 — Org Structure (Company Skeleton)

**Goal**: Give each workspace a real org chart — departments, teams, job titles, reporting lines. This is the structural layer that Phase 08 (HR) builds on top of.

**Why it's separate from HR**: Org structure is useful standalone — it unlocks org chart view, team-based task filtering ("assign to Backend Team"), and "who's on which team" queries — before any HR operations are needed.

**Architecture note**: `WorkspaceMember` is NOT replaced. It remains the platform access record (controls tool access). Org structure models are additive — they describe the company's real-world shape.

```
WorkspaceMember (access control: who can use the tool)
    +
EmployeeProfile (org data: job title, level, start date, reports_to)
    +
Department (org unit: Engineering, Marketing, HR)
    +
Team (sub-unit: Backend Team, Mobile Team — can be cross-dept)
    +
TeamMembership (user ↔ team with a role: Lead, Senior, Mid, Junior)
```

**Backend changes**:

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Department` | `workspace` (FK), `name`, `head` (FK→User, nullable), `parent` (FK self — nested depts), `order` | Supports nested org units |
| `Team` | `workspace` (FK), `department` (FK, nullable), `name`, `description`, `lead` (FK→User, nullable) | Can be cross-functional (no dept) |
| `TeamMembership` | `team` (FK), `user` (FK), `job_title`, `level` (JUNIOR/MID/SENIOR/LEAD/MANAGER/DIRECTOR/C_LEVEL), `is_lead` | unique: team+user |
| `EmployeeProfile` | `workspace_member` (O2O), `department` (FK, nullable), `job_title`, `employment_type` (FULL_TIME/PART_TIME/CONTRACTOR/INTERN), `start_date`, `reports_to` (FK→User, nullable), `employee_id` | Extends WorkspaceMember with org identity |

**API surface**:
- `GET/POST /api/workspaces/{ws}/departments/`
- `GET/PATCH/DELETE /api/workspaces/{ws}/departments/{id}/`
- `GET/POST /api/workspaces/{ws}/teams/`
- `GET/PATCH/DELETE /api/workspaces/{ws}/teams/{id}/`
- `GET/POST /api/workspaces/{ws}/teams/{id}/members/`
- `PATCH/DELETE /api/workspaces/{ws}/teams/{id}/members/{mid}/`
- `GET/PATCH /api/workspaces/{ws}/members/{id}/profile/` (employee profile)
- `GET /api/workspaces/{ws}/org-chart/` (full tree — dept → teams → members)

**Frontend**: Org chart page (tree layout), team directory, member profile card showing team + title + level.

---

### Phase 08 — HR Management App

**Goal**: People operations layer built on top of Phase 07's org structure. Think BrightHR-lite — leave management, attendance, employee lifecycle.

**Depends on**: Phase 06 (RBAC — HR manager role), Phase 07 (Org Structure — you need departments and teams to manage people within them).

**Backend changes**:

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `LeavePolicy` | `workspace` (FK), `name`, `leave_type` (ANNUAL/SICK/UNPAID/PATERNITY/MATERNITY), `days_per_year`, `carry_over_days`, `accrual_type` | Workspace-level policy config |
| `LeaveBalance` | `employee` (FK→WorkspaceMember), `policy` (FK), `year`, `total_days`, `used_days`, `pending_days` | Computed from approved requests |
| `LeaveRequest` | `employee` (FK→WorkspaceMember), `policy` (FK), `start_date`, `end_date`, `reason`, `status` (PENDING/APPROVED/REJECTED/CANCELLED), `approver` (FK→User, nullable), `reviewed_at` | |
| `Attendance` | `employee` (FK→WorkspaceMember), `date`, `clock_in`, `clock_out`, `source` (MANUAL/QR/API) | Optional — can be Phase 8.5 |

**API surface**:
- `GET/POST /api/workspaces/{ws}/hr/leave-policies/`
- `GET/POST /api/workspaces/{ws}/hr/leave-requests/`
- `PATCH /api/workspaces/{ws}/hr/leave-requests/{id}/review/`
- `GET /api/workspaces/{ws}/hr/leave-balances/`
- `GET /api/workspaces/{ws}/hr/whos-off/` (today's absences — used in workspace home widget)

**Frontend**: HR section — leave calendar, employee leave balance cards, manager approval queue, "who's off this week" dashboard widget.

---

### Phase 09 (ex-Phase 06) — Workspace Federation

**Goal**: Let a business connect their JCN workspace to a partner, client, or subsidiary workspace — sharing members or tasks across trust boundaries with granular controls.

**Deferred intentionally**: this is a distribution/ecosystem integration feature. Build it after the product is mature and org structure is in place, so the cross-workspace trust model has something real to reference.

**High-level concept**:
- `WorkspaceTrust` — a directional link between two workspaces (`source` → `trusted`)
- A trusted workspace can share specific members, boards, or tasks with the source workspace via a single-click invite flow
- Fine-grained: trust can be scoped to "read tasks only" or "full member sync"

---

## Phase Summary

| # | Name | App | Status |
|---|------|-----|--------|
| 01 | Workspace Foundation | `workspaces/` | ✅ Done |
| 02 | Project Management Core | `projects/` | ✅ Done |
| 03 | Power Features | `projects/` | ✅ Done |
| 04 | Knowledge & Intake | `projects/` | ✅ Done |
| 05 | Automation & Intelligence | `projects/` | ✅ Done |
| 06 | Custom RBAC | `workspaces/` | 🔜 Next |
| 07 | Org Structure | `people/` | 📋 Planned |
| 08 | HR Management | `people/` | 📋 Planned |
| 09 | Workspace Federation | `workspaces/` | 🔮 Future |
