# Secure Visitor and Access Control Management System

A visitor management MVP that replaces manual logbooks with digital registration, QR-code visitor passes, role-based check-in/check-out, and basic reporting.

---

## Features

- **Authentication** — JWT login with role-based access control (Admin, Receptionist, Security Officer, Employee)
- **Visitor & visit management** — register visitors, schedule visits, assign a host employee
- **QR visitor passes** — unique, time-limited, single-use QR codes per visit
- **Check-in / check-out** — Security Officers verify and scan passes, track who is currently on-site
- **Dashboards & reports** — role-specific summaries, daily/weekly/monthly visit reports
- **Employee management** — Admins manage staff records who can host visitors
- **Email notifications** — QR pass automatically emailed to the visitor on generation (via Gmail SMTP)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL |
| Authentication | JWT (`djangorestframework-simplejwt`) |
| QR codes | `qrcode` (Python) |
| Email | Django `MAILERS` (Gmail SMTP) |

---

## Requirements

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

---

## Project Structure

```
secure-visitor-system/
├── backend/          # Django + DRF API
├── frontend/         # React + Vite + TypeScript
├── database/         # (reserved for schema/seed scripts)
├── docs/             # (reserved for additional documentation)
└── README.md
```

---

## Setup — Ubuntu / Linux

### 1. Clone and enter the project

```bash
git clone <your-repo-url> secure-visitor-system
cd secure-visitor-system
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install django djangorestframework djangorestframework-simplejwt psycopg2-binary python-decouple qrcode[pil] django-cors-headers
```

### 3. Database setup

```bash
sudo -u postgres psql
```

Inside the `psql` shell:

```sql
CREATE DATABASE visitor_system_db;
CREATE USER visitor_admin WITH PASSWORD 'your_db_password';
ALTER ROLE visitor_admin SET client_encoding TO 'utf8';
ALTER ROLE visitor_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE visitor_admin SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE visitor_system_db TO visitor_admin;
ALTER DATABASE visitor_system_db OWNER TO visitor_admin;
\q
```

### 4. Environment variables

Copy `.env.example` to `.env` inside `backend/` and fill in real values (see [Environment Variables](#environment-variables) below).

```bash
cp .env.example .env
```

### 5. Run migrations and create an admin account

```bash
python3 manage.py migrate
python3 manage.py createsuperuser
```

After creating the superuser, log into `http://127.0.0.1:8000/admin/`, open the user, and set their **Role** to `Admin` (the Django admin form doesn't set this custom field automatically).

### 6. Start the backend

```bash
python3 manage.py runserver
```

Runs at `http://127.0.0.1:8000`.

### 7. Frontend setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`.

---

## Setup — Windows

The same steps apply, with these differences:

- **Virtual environment activation:**
  ```powershell
  python -m venv venv
  venv\Scripts\activate
  ```
- **PostgreSQL:** install via the official Windows installer from postgresql.org, then use `psql` from the Start Menu or command line the same way.
- **No `sudo`** — run `psql` directly as the `postgres` user via pgAdmin or the command line tool installed with PostgreSQL.
- Everything else (pip installs, `.env` file, `manage.py` commands, `npm install`, `npm run dev`) is identical — Django, PostgreSQL, and Node.js all behave the same way across operating systems once installed.

---

## Environment Variables

Create `backend/.env` (never commit this file — it's already in `.gitignore`):

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=visitor_system_db
DB_USER=visitor_admin
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST_USER=your-gmail-address@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-gmail-app-password
```

**Getting a Gmail App Password** (required for `EMAIL_HOST_PASSWORD`):
1. Enable 2-Step Verification on the sending Gmail account: `https://myaccount.google.com/security`
2. Generate an app password: `https://myaccount.google.com/apppasswords`
3. Use the 16-character password **with spaces removed**

If you don't want to send real emails yet, set `backend/config/settings.py`'s `MAILERS` block to use `django.core.mail.backends.console.EmailBackend` — emails will print to the terminal instead of sending.

---

## Database Setup Summary

The system uses five core models:

- **User** — extends Django's auth user, adds `role` and an optional link to `Employee`
- **Employee** — staff who can host visitors
- **Visitor** — external people who visit the organization
- **Visit** — a scheduled visit linking a Visitor to a host Employee, with status tracking
- **VisitorPass** — a unique QR token tied to a Visit, with expiry and single-use enforcement

Run `python3 manage.py migrate` to create all tables after configuring your `.env`.

---

## How to Run the System

1. Start PostgreSQL (usually runs automatically as a service after install)
2. Start the backend: `cd backend && source venv/bin/activate && python3 manage.py runserver`
3. Start the frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173` in your browser

---

## Test Accounts

Create these manually via Django admin (`http://127.0.0.1:8000/admin/core/user/`) after your first superuser exists. For each, set **Role** on the user edit page — it is not set automatically.

| Role | Suggested username | Notes |
|---|---|---|
| Admin | `admin` | Created via `createsuperuser`; set Role manually afterward |
| Receptionist | `receptionist1` | Create via Django admin, set Role = Receptionist |
| Security Officer | `officer1` | Create via Django admin, set Role = Security Officer |
| Employee | `employee1` | Create via Django admin, set Role = Employee, and link an Employee record for their dashboard to work |

---

## Basic API Reference

Base URL: `http://127.0.0.1:8000/api/`

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/token/` | POST | Public | Login, returns JWT access + refresh |
| `/token/refresh/` | POST | Public | Refresh an access token |
| `/visitors/` | GET/POST/PUT/PATCH/DELETE | Admin, Receptionist | Visitor CRUD |
| `/visits/` | GET/POST/PUT/PATCH/DELETE | Admin, Receptionist | Visit CRUD |
| `/employees/` | GET/POST/PUT/PATCH/DELETE | Admin (write), any authenticated (read) | Employee CRUD |
| `/visits/{id}/generate-pass/` | POST | Admin, Receptionist | Generate QR pass, emails visitor if email on file |
| `/visits/{id}/qr/` | GET | Admin, Receptionist | Returns the QR code as a PNG image |
| `/passes/verify/` | POST | Security Officer | Verify a pass token without checking in |
| `/passes/check-in/` | POST | Security Officer | Verify and check in a visitor |
| `/visits/{id}/check-out/` | POST | Security Officer | Check out a checked-in visitor |
| `/visits/currently-inside/` | GET | Security Officer | List all visitors currently on-site |
| `/dashboard/summary/` | GET | Any authenticated | Role-specific dashboard data |
| `/reports/visits/?period=daily\|weekly\|monthly` | GET | Admin, Receptionist | Visit report with counts and full list |

---

## Known Limitations (Intentional, Post-MVP)

The following were deliberately left out of this MVP and can be added later without changing the existing architecture:

- Real-time WebSocket alerts, SMS notifications
- CCTV integration, multiple physical access points
- Biometric or facial recognition
- Camera-based in-browser QR scanning (a USB QR scanner works today with the existing manual-entry Verify Pass screen — no code changes needed)
- Advanced audit analytics, PDF/Excel report export
- Automated backup management interface
