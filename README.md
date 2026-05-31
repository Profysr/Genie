# JCN — Project Management

## Quick Start

### Option A: Docker (recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

### Option B: Local dev (no Docker)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## First run
1. Go to http://localhost:5173/register
2. Create an account
3. You'll be prompted to create your first workspace
4. Invite teammates via the Members section

## API Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/registration/ | Register |
| POST | /api/auth/login/ | Login (returns JWT) |
| POST | /api/auth/logout/ | Logout |
| GET/PATCH | /api/users/me/ | Current user profile |
| GET/POST | /api/workspaces/ | List / create workspaces |
| GET/PATCH/DELETE | /api/workspaces/:slug/ | Workspace detail |
| GET | /api/workspaces/:slug/members/ | List members |
| POST | /api/workspaces/:slug/invite/ | Invite by email |
| POST | /api/invites/:token/accept/ | Accept invite |
