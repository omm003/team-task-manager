# TaskFlow — Team Task Manager

A full-stack collaborative task management app built with React, Node.js/Express, and SQLite. Think simplified Trello/Asana for teams.

## Live Demo
team-task-manager-production-9a5d.up.railway.app

## Features

- **JWT Authentication** — Signup/login with secure token auth
- **Project Management** — Create projects, invite teammates, manage roles
- **Role-Based Access** — Admins manage everything; Members update task status on assigned tasks
- **Task Management** — Create tasks with title, description, priority, due date, assignee
- **Kanban Board** — Drag-friendly column view (To Do / In Progress / Done)
- **List View** — Filterable flat list of all project tasks
- **Dashboard** — Stats: total tasks, by status, overdue, team workload chart
- **Overdue Detection** — Visual warnings on tasks past their due date

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite |
| Backend | Node.js, Express 4 |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Railway |

## Project Structure

```
team-task-manager/
├── backend/
│   ├── db/database.js       # SQLite schema & connection
│   ├── middleware/auth.js   # JWT auth + role check middleware
│   ├── routes/
│   │   ├── auth.js          # POST /signup, /login, GET /me
│   │   ├── projects.js      # CRUD projects + member management
│   │   ├── tasks.js         # CRUD tasks (nested under projects)
│   │   └── dashboard.js     # Aggregate stats
│   └── server.js            # Express app entry point
├── frontend/
│   └── src/
│       ├── components/      # Layout, UI primitives, TaskModal, TaskDetail
│       ├── context/         # AuthContext (user state)
│       ├── pages/           # Auth, Dashboard, Projects, ProjectDetail
│       └── api.js           # Fetch wrapper with auth token injection
├── railway.toml
└── nixpacks.toml
```

## Local Development

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & install

```bash
git clone <https://github.com/omm003/team-task-manager.git>
cd team-task-manager
npm run install:all
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env:
# JWT_SECRET=your_secret_key_here
# PORT=5000
```

### 3. Run backend

```bash
npm run dev:backend
# Server: http://localhost:5000
```

### 4. Run frontend

```bash
npm run dev:frontend
# App: http://localhost:5173
```

## API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | `{name, email, password}` | Register user |
| POST | `/api/auth/login` | `{email, password}` | Login, returns JWT |
| GET | `/api/auth/me` | — | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | List my projects |
| POST | `/api/projects` | Auth | Create project (becomes Admin) |
| GET | `/api/projects/:id` | Member | Project + members |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:uid` | Admin | Remove member |
| PATCH | `/api/projects/:id/members/:uid/role` | Admin | Change member role |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects/:id/tasks` | Member | List tasks (filterable) |
| POST | `/api/projects/:id/tasks` | Admin | Create task |
| PATCH | `/api/projects/:id/tasks/:tid` | Admin/Assignee | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | Admin | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Aggregate stats across all user's projects |

## Deployment to Railway

### Option A: One-Click (Recommended)
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Set environment variables in Railway dashboard:
   ```
   JWT_SECRET=<strong_random_string>
   NODE_ENV=production
   DB_PATH=/app/data/tasks.db
   ```
5. Railway auto-detects `nixpacks.toml`, builds, and deploys

### Option B: Railway CLI
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs |
| `PORT` | ❌ | 5000 | Server port |
| `NODE_ENV` | ❌ | development | Set to `production` on Railway |
| `DB_PATH` | ❌ | ./data/tasks.db | SQLite database file path |
| `FRONTEND_URL` | ❌ | * | CORS origin whitelist |

> **Note on SQLite persistence on Railway:** Railway's filesystem is ephemeral by default. For production, either use Railway's persistent volume (mount at `/app/data`) or migrate to PostgreSQL using the `pg` package as a drop-in via `better-sqlite3`-to-Postgres adapter.

## Database Schema

```sql
users          (id, name, email, password, created_at)
projects       (id, name, description, created_by, created_at)
project_members(project_id, user_id, role, joined_at)  -- role: admin|member
tasks          (id, title, description, project_id, assigned_to, created_by,
                status, priority, due_date, created_at, updated_at)
               -- status: todo|inprogress|done
               -- priority: low|medium|high|urgent
```

## Role-Based Access Summary

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete tasks | ✅ | ❌ |
| Assign tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks only) |
| Manage members | ✅ | ❌ |
| View project tasks | ✅ | ✅ |
| Delete project | ✅ | ❌ |

## Author
Built as a full-stack assignment demonstrating: REST API design, JWT auth, relational data modeling, React SPA architecture, and Railway deployment.
