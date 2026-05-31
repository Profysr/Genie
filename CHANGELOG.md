# Changelog

## v0.1.0 — Foundation & Auth (Week 1)
> Status: COMPLETE ✅

### Backend
- Django 5 + Django REST Framework project scaffold
- Custom `User` model — email-based auth, UUID primary key, no username field
- `dj-rest-auth` + `allauth` for registration, login, logout, JWT token flow
- JWT access tokens (1hr) + refresh tokens (30 days, rolling)
- `accounts` app — `/api/users/me/` GET/PATCH endpoint
- `workspaces` app — full CRUD for workspaces, members, invites
  - Role system: admin / member / viewer
  - Invite by email with token-based accept flow
  - Only workspace owner can delete a workspace
  - Only admins can remove members or update roles
- Django Channels + Redis channel layer (WebSocket infrastructure ready)
- drf-spectacular → Swagger UI at `/api/docs/`

### Frontend
- React + Vite + TailwindCSS + shadcn/ui base components (Button, Input, Label, Card)
- TanStack Query v5 with devtools
- Zustand auth store — login, register, logout, token persist to localStorage
- Axios client with JWT auto-refresh interceptor + 401 redirect
- `ProtectedRoute` — blocks unauthenticated access, redirects to `/login`
- Pages: Login, Register, Onboarding (create workspace), Dashboard shell
- `AppLayout` — sidebar with workspace switcher, nav links, user panel + logout
- `WorkspaceRedirect` — on login, redirects to first workspace or onboarding
- React Router v6 nested routes under `/w/:workspaceSlug`

### Infra
- `docker-compose.yml` — all services, `env_file` per service
- `.dockerignore` for both backend and frontend
- `.gitignore`

---

## v0.2.0 — Task Engine (Week 2)
> Status: COMPLETE ✅

### Backend
- `projects` app — `Project`, `TaskStatus`, `Task`, `SubTask`, `TaskComment` models
- UUID primary keys on all models; Task has priority choices + order field
- `ProjectSerializer` auto-creates 4 default Kanban columns on project creation: Backlog → In Progress → In Review → Done
- `TaskSerializer` (list view with subtask/comment counts) + `TaskDetailSerializer` (full nested data)
- `TaskMoveView` — atomic status + order update for drag-and-drop, single endpoint
- `broadcast()` helper — all mutations push real-time events to workspace WebSocket group

### Frontend
- `useProjects` + `useTasks` — TanStack Query hooks for all CRUD operations
- `useMoveTask` — optimistic update: board reorders instantly, rolls back on error
- `useWorkspaceSocket` — WebSocket hook patches TanStack Query cache on `task.created/updated/moved/deleted`
- `KanbanPage` — `DragDropContext` wrapping all columns, calls `useMoveTask` on drag end
- `KanbanColumn` — droppable column with color dot, task count, inline add button
- `TaskCard` — draggable, shows priority icon, due date, subtask progress bar, comment count, assignee avatar
- `CreateTaskModal` — title, description, priority, due date, assignee, default status pre-selected
- `CreateProjectModal` — name + description, navigates to new project's board on create
- `ProjectsPage` — project grid with empty state
- `DashboardPage` — real stats (project count, total tasks, member count) + recent projects grid
- Routes added: `/w/:workspaceSlug/projects` and `/w/:workspaceSlug/projects/:projectId`

---

## v0.3.0 — Collaboration (Week 3)
> Status: COMPLETE ✅

### Backend
- `TaskActivity` model — immutable audit log per task event (created, status_changed, priority_changed, assigned, commented, subtask_added)
- `TaskActivitySerializer` + `TaskActivityListView` — `/tasks/<id>/activity/` endpoint
- `TaskDetailSerializer` extended with nested `activities`
- `broadcast()` now fires `comment.created` / `comment.deleted` WebSocket events
- Activity auto-logged in all task mutation views (create, update, move, comment, subtask add)

### Frontend
- `TaskDetailPanel` — right-side slide panel, opens on task card click
  - Inline title + description editing (click to edit, blur to save)
  - Status, priority, due date dropdowns — updates persist immediately
  - Subtasks checklist: add, toggle done, delete
  - Comments thread: post with Enter / Send button, delete own comments
  - Activity log: timestamped event feed showing all field changes
- Selected task card gets a blue ring highlight
- `useTaskDetail` + `useWorkspaceSocket` handle comment real-time updates across tabs

---

## v0.4.0 — Members, Settings & Workspace Management (Week 4)
> Status: IN PROGRESS 🔨
