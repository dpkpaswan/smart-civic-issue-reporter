# 🏙️ Smart Civic Issue Reporter

A production-ready full-stack web platform that enables citizens to report civic issues (potholes, garbage, streetlight failures, etc.) with **AI-powered image classification**, **automatic geolocation**, and **real-time status tracking**. Municipal authorities manage issues through a secure dashboard while the public gets full transparency.

---

## 🚀 Key Features

### 🏠 Citizen Portal
- **Smart Issue Reporting** — 3-step wizard: upload photos → AI auto-classifies category → auto-detect GPS location → submit
- **AI Image Classification** — Google Gemini 2.5 Flash Vision analyzes uploaded photos and suggests the issue category with confidence scores
- **Duplicate Detection** — AI compares uploaded images against nearby issues to prevent duplicate reports
- **Auto Geolocation** — Browser GPS + OpenStreetMap Nominatim reverse geocoding (no API key required)
- **Issue Tracking** — Unique issue IDs with real-time status updates
- **Resolution Feedback** — Citizens can rate resolutions (1–5 stars)

### 🏛️ Authority Dashboard (Protected)
- **Secure JWT Authentication** — Role-based login with bcrypt password hashing
- **Issue Lifecycle Management** — Full workflow: Submitted → Assigned → In Progress → Resolved → Closed
- **Metrics & Filters** — Real-time stats panel, advanced filtering (status, category, priority, date), sorting, bulk actions
- **Resolution Proof** — Mandatory before/after photo upload when marking issues as resolved
- **Priority & Status Updates** — Modals for updating status and priority with notes
- **Department-Scoped View** — Authority users see only their department's issues; admins see all

### 🌍 Public Transparency Dashboard
- **Open Access** — No login required, full public visibility of all issues
- **Filters & Search** — Filter by category, status, priority; full-text search
- **Before & After Comparison** — Resolved issues show citizen-reported photo alongside resolution proof
- **Success Stories** — Dedicated carousel of resolved issues with real before/after images
- **Live Statistics** — Issue counts, resolution rates, category breakdown

### 🤖 AI Classification Engine
- **Dual Classification** — Text keyword analysis + Gemini Vision image analysis (80% image / 20% text weighting)
- **Smart Priority Scoring** — Analyzes description urgency keywords, location importance (school zones, highways), and evidence quality
- **Image Duplicate Detection** — Gemini Vision compares photos against nearby issues (100m radius, 24h window) to flag duplicates
- **Confidence Scoring** — Every classification includes a confidence percentage and human-readable explanation

### 🔐 Security & Enterprise Features
- **4-Tier Role Hierarchy** — Citizen → Authority → Admin → Super Admin with granular permissions
- **Rate Limiting** — 100 req/15min general, 5 req/15min auth, 10 issues/hour creation
- **Spam Detection** — Checks for repeated characters, URLs, spam phrases, all-caps
- **Input Sanitization** — Recursive XSS prevention (script tags, event handlers, javascript: protocol)
- **Audit Trail** — Complete logging of all system actions to `audit_logs` table
- **SLA Management** — Per-department SLA hours, deadline tracking, hourly auto-escalation
- **Email Notifications** — Gmail SMTP for issue creation confirmation and resolution alerts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · Vite 5 · TailwindCSS 3.4 · Framer Motion · Recharts · React Leaflet |
| **Backend** | Node.js 18+ · Express 4.18 · Joi Validation · Multer (file uploads) |
| **Database** | Supabase (PostgreSQL) with real-time capabilities |
| **AI** | Google Gemini 2.5 Flash (Vision + Text) via `@google/generative-ai` |
| **Auth** | JWT (24h expiry) · bcrypt · Role-based access control |
| **Security** | Helmet · CORS · express-rate-limit · Input sanitization · Spam detection |
| **Email** | Nodemailer (Gmail SMTP) |
| **Maps** | Leaflet + OpenStreetMap (free) · Optional Google Maps geocoding |
| **Deployment** | Frontend on Vercel · Backend on Render |

---

## 📁 Project Structure

```
smart-civic-issue-reporter/
├── frontend/                          # React SPA (Vite)
│   ├── public/                        # Static assets
│   │   └── assets/images/             # App icons, placeholders
│   ├── src/
│   │   ├── App.jsx                    # Root component
│   │   ├── index.jsx                  # Entry point
│   │   ├── Routes.jsx                 # Route definitions
│   │   ├── components/
│   │   │   ├── AppIcon.jsx            # Lucide icon wrapper
│   │   │   ├── AppImage.jsx           # Image with URL resolution & fallback
│   │   │   ├── ErrorBoundary.jsx      # React error boundary
│   │   │   ├── LocationMap.jsx        # Leaflet map component
│   │   │   ├── ProtectedRoute.jsx     # Auth route guard
│   │   │   ├── ScrollToTop.jsx        # Route change scroll handler
│   │   │   └── ui/                    # Reusable UI components
│   │   │       ├── Button.jsx
│   │   │       ├── Header.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Select.jsx
│   │   │       ├── Toast.jsx
│   │   │       ├── Loading.jsx        # Spinners, skeletons, overlays
│   │   │       ├── IssueStatusIndicator.jsx
│   │   │       ├── LocationDisplay.jsx
│   │   │       ├── AIClassificationBadge.jsx
│   │   │       └── ProgressWorkflowIndicator.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # JWT auth state management
│   │   ├── hooks/
│   │   │   ├── useAccurateLocationDetection.js   # GPS + OSM geocoding
│   │   │   ├── useGoogleHighAccuracyLocation.js  # GPS + Google geocoding
│   │   │   └── useHighAccuracyLocation.js        # Raw GPS detection
│   │   ├── pages/
│   │   │   ├── home-landing/          # Public landing page
│   │   │   ├── report-issue/          # 3-step issue reporting wizard
│   │   │   ├── issue-confirmation/    # Post-submission confirmation
│   │   │   ├── public-transparency/   # Public issue dashboard
│   │   │   ├── authority-login/       # Admin/authority login
│   │   │   ├── authority-dashboard/   # Protected management dashboard
│   │   │   └── NotFound.jsx           # 404 page
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── tailwind.css
│   │   └── utils/
│   │       ├── api.js                 # Axios client + API functions
│   │       ├── cn.js                  # Class name merge utility
│   │       └── toast.js               # Toast notification helper
│   ├── .env                           # Local dev environment
│   ├── .env.production                # Production environment
│   ├── vite.config.mjs
│   ├── tailwind.config.js
│   ├── vercel.json                    # Vercel deployment config
│   └── package.json
│
├── backend/                           # Express REST API
│   ├── server.js                      # App entry point (middleware, routes, cron)
│   ├── config/
│   │   └── database.js               # Supabase client + schema initialization
│   ├── middleware/
│   │   ├── auth.js                   # JWT auth, role checks, department access
│   │   ├── security.js               # Helmet, rate limiting, spam, sanitization
│   │   └── validation.js             # Joi schemas for all endpoints
│   ├── routes/
│   │   ├── issues.js                 # Issue CRUD, status, feedback, success stories
│   │   ├── auth.js                   # Login, user management, permissions
│   │   ├── upload.js                 # Image upload + AI classification
│   │   ├── departments.js            # Department CRUD, assignment, SLA, performance
│   │   └── admin.js                  # Dashboard stats, analytics, system health
│   ├── services/
│   │   ├── AIService.js              # Text-based keyword classification
│   │   ├── AIClassificationService.js # Gemini Vision image classification
│   │   ├── AuditService.js           # Audit trail logging
│   │   ├── AuthService.js            # JWT auth + user management
│   │   ├── DepartmentService.js      # Routing, SLA, performance metrics
│   │   ├── ImageDuplicateService.js  # Gemini Vision duplicate detection
│   │   ├── IssueService.js           # Core issue lifecycle orchestration
│   │   └── NotificationService.js    # Email notifications (Gmail SMTP)
│   ├── scripts/
│   │   ├── supabase-setup.sql        # Full database schema + seed data
│   │   ├── setup-real-users.js       # User creation script
│   │   └── generate-user-sql.js      # SQL generation for users
│   ├── uploads/                       # Uploaded images directory
│   ├── render.yaml                    # Render deployment config
│   └── package.json
│
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Supabase account** (free tier: [supabase.com](https://supabase.com))
- **Google Gemini API key** (free: [aistudio.google.com](https://aistudio.google.com))

### 1. Clone & Install

```bash
git clone <repo-url>
cd smart-civic-issue-reporter

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `backend/scripts/supabase-setup.sql`
3. Copy your **Project URL** and **Service Role Key** from Settings → API

### 3. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-service-role-key

# Server
PORT=5000
JWT_SECRET=your-secure-jwt-secret

# AI Classification (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Email Notifications (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Frontend** — `frontend/.env` should have:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm start

# Terminal 2 — Frontend (port 4028)
cd frontend
npm start
```

Open **http://localhost:4028** in your browser.

---

## 🔑 Authentication

### Role Hierarchy
| Role | Permissions |
|------|------------|
| **Super Admin** | Full system access, department CRUD, user management, system health |
| **Admin** | Dashboard, analytics, issue management, user management |
| **Authority** | Department-scoped issue management, status/priority updates |
| **Citizen** | Report issues, track status, submit feedback (no login required) |

### Default Authority Credentials
After running the setup SQL, use these to login at `/authority-login`:

| Department | Username | Password |
|-----------|----------|----------|
| Roads & Infrastructure | `roads.admin` | `SecureRoad2026!` |
| Waste Management | `waste.admin` | `CleanCity2026!` |
| Public Utilities | `utilities.admin` | `PowerLight2026!` |
| General Administration | `general.admin` | `CityAdmin2026!` |

---

## 📡 API Endpoints

### Issues (`/api/issues`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/issues` | Optional | List issues with filtering & pagination |
| GET | `/api/issues/success-stories` | Public | Resolved issues with before/after images |
| GET | `/api/issues/statistics` | Authority+ | Dashboard statistics by timeframe |
| GET | `/api/issues/my/dashboard` | Public | Citizen's issues by email |
| GET | `/api/issues/:id` | Optional | Issue details with audit logs |
| GET | `/api/issues/:id/audit-logs` | Authority+ | Issue audit trail |
| POST | `/api/issues` | Public | Create issue (triggers AI + auto-routing) |
| PUT | `/api/issues/:id/status` | Authority+ | Update status |
| PATCH | `/api/issues/:id/status` | Authority+ | Update status (alias) |
| PATCH | `/api/issues/:id/priority` | Authority+ | Update priority |
| PUT | `/api/issues/:id/assign` | Admin+ | Assign to department/user |
| PUT | `/api/issues/:id/reassign` | Admin+ | Reassign to different department |
| POST | `/api/issues/:id/feedback` | Public | Submit citizen feedback (1–5 rating) |
| PUT | `/api/issues/:id` | Admin+ | Update issue fields |
| DELETE | `/api/issues/:id` | Super Admin | Soft-delete (reject) issue |

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login → JWT token |
| POST | `/api/auth/logout` | Authenticated | Logout |
| GET | `/api/auth/me` | Authenticated | Current user profile + permissions |
| POST | `/api/auth/users` | Admin+ | Create user |
| GET | `/api/auth/users` | Admin+ | List users |
| GET | `/api/auth/users/:id` | Admin+ / Self | Get user |
| PUT | `/api/auth/users/:id` | Admin+ / Self | Update user |
| DELETE | `/api/auth/users/:id` | Admin+ | Deactivate user |
| POST | `/api/auth/change-password` | Authenticated | Change password |
| GET | `/api/auth/permissions` | Authenticated | Permission matrix |

### Upload (`/api/upload`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/classify` | Public | Upload image + Gemini AI classification |
| POST | `/api/upload/image` | Public | Single image upload |
| POST | `/api/upload/images` | Public | Multiple images (max 5, 5MB each) |
| DELETE | `/api/upload/:filename` | Public | Delete uploaded file |
| GET | `/api/upload/list` | Public | List uploaded files |

### Departments (`/api/departments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/departments` | Admin+ | List departments |
| GET | `/api/departments/:id` | Admin+ | Department details |
| POST | `/api/departments` | Super Admin | Create department |
| PUT | `/api/departments/:id` | Super Admin | Update department |
| DELETE | `/api/departments/:id` | Super Admin | Delete department |
| PUT | `/api/departments/:id/status` | Admin+ | Toggle active/inactive |
| GET | `/api/departments/:id/issues` | Authority+ | Department issues |
| POST | `/api/departments/:id/assign-issue` | Admin+ | Assign issue |
| GET | `/api/departments/:id/performance` | Authority+ | Performance metrics |
| PUT | `/api/departments/:id/sla` | Super Admin | Update SLA settings |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard` | Admin+ | Comprehensive dashboard stats |
| GET | `/api/admin/analytics` | Admin+ | Detailed analytics |
| GET | `/api/admin/system-health` | Super Admin | System health monitoring |
| GET | `/api/admin/users` | Admin+ | User management data |
| PUT | `/api/admin/users/:id/status` | Admin+ | Update user status |
| GET | `/api/admin/audit-logs` | Admin+ | System audit logs |
| GET | `/api/admin/reports` | Admin+ | Generate reports |
| POST | `/api/admin/maintenance/cleanup` | Super Admin | System cleanup |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | System status (DB, uptime, memory) |

---

## 🗄️ Database Schema

### Tables
- **`departments`** — Municipal departments (ROADS, SANITATION, WATER, ELECTRICITY, TRAFFIC, PARKS, PLANNING)
- **`users`** — System users with roles and department assignments
- **`issues`** — Full issue lifecycle with AI classification, SLA tracking, status history, citizen feedback
- **`audit_logs`** — Complete audit trail for all system actions
- **`notifications`** — Email notification records

### Issue Categories
`pothole` · `garbage` · `streetlight` · `water` · `traffic` · `graffiti` · `sidewalk` · `other`

### Status Workflow
```
Submitted → Assigned → In Progress → Resolved → Closed
                                   ↘ Rejected
```

---

## 🔧 Background Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Every hour | SLA Check | Flags overdue issues, auto-escalates |
| Every 30min | Notification Retry | Retries failed email notifications |
| Weekly (Sunday 2 AM) | Audit Cleanup | Removes audit logs older than 90 days |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy the build/ directory to Vercel
# vercel.json handles SPA rewrites and asset caching
```

### Backend → Render
```bash
# render.yaml is pre-configured
# Set environment variables in Render dashboard
# Backend deploys from the /backend directory
```

### Production Environment
- **Frontend**: Set `VITE_API_BASE_URL` to your Render backend URL in `.env.production`
- **Backend**: Set all env vars (Supabase, JWT, Gemini, Email) in Render dashboard

---

## 📋 Issue Reporting Flow

```
Citizen uploads photo
        ↓
Gemini Vision AI classifies image → category + confidence
        ↓
Text AI analyzes description → severity + priority
        ↓
Dual results merged (80% image / 20% text)
        ↓
Auto-assigned to department by category
        ↓
SLA deadline set based on department settings
        ↓
Email confirmation sent to citizen
        ↓
Authority manages → updates status with notes
        ↓
Resolved: must upload proof photos (before/after)
        ↓
Email notification sent to citizen
        ↓
Citizen can rate the resolution (1–5 stars)
```

---

## 🧰 Scripts

```bash
# Backend
npm start              # Start production server
npm run dev            # Start with nodemon (auto-reload)

# Frontend
npm start              # Start Vite dev server (port 4028)
npm run build          # Production build → build/ directory
npm run serve          # Preview production build
```

---

## 📄 Frontend Routes

| Path | Page | Protected |
|------|------|-----------|
| `/` | Home Landing | No |
| `/report-issue` | Issue Reporting Wizard | No |
| `/issue-confirmation` | Submission Confirmation | No |
| `/public-transparency` | Public Issue Dashboard | No |
| `/authority-login` | Authority Login | No |
| `/authority-dashboard` | Management Dashboard | Yes |
| `*` | 404 Not Found | No |

---

**Built with** React · Node.js · Supabase · Google Gemini AI · TailwindCSS
