# Chavan's Child Clinic — Patient Management System

A full-stack web application for managing patients, visits, and prescriptions at a pediatric clinic.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18 + TypeScript + Vite + Tailwind CSS     |
| Backend   | Node.js + Express.js                            |
| Database  | SQLite (via `sql.js` — pure JavaScript, no native deps) |
| Auth      | JWT (jsonwebtoken) + bcrypt                     |

---

## Features

- **Secure Login** — Role-based access (Doctor / Receptionist)
- **Patient Management** — Register, view, edit, archive patients
- **Patient Search** — By name, patient ID, or phone number (paginated)
- **Visit History** — Record visits with complaints, provisional diagnosis, observations, follow-up date
- **Follow-up Tracking** — Dashboard shows upcoming follow-ups (7 days)
- **Prescriptions** — Create multi-medicine prescriptions per visit with investigations and notes
- **Medicine Autocomplete** — Type to search from the medicines master; reference hints (description, typical dosage) shown to doctor but never printed
- **Medicines Master** — Doctor can upload an Excel file (`.xlsx`) to populate/update the medicines database; supports re-upload (upserts by name)
- **Print / PDF** — Printable prescription with plain-paper or letterhead toggle
- **Dashboard** — Stats, recent patients, upcoming follow-ups
- **Profile** — Doctor can edit name, username, and password

---

## Prerequisites

Make sure the following are installed before getting started:

| Requirement | Version   | Download |
|-------------|-----------|----------|
| Node.js     | **v18 or higher** (v20/v22/v25 all work) | https://nodejs.org |
| npm         | Comes with Node.js | — |
| Git (optional) | Any version | https://git-scm.com |

> **Note:** This app uses `sql.js` (pure-JS SQLite) instead of `better-sqlite3`, so no native build tools (Python, node-gyp, Visual Studio Build Tools) are required.

---

## Installation & Running

### Step 1 — Install Backend Dependencies

Open a terminal and run:

```bash
cd clinic-app/backend
npm install
```

### Step 2 — Configure Environment (first time only)

Create a `.env` file in `clinic-app/backend/`:

```
PORT=5000
JWT_SECRET=change-this-to-a-long-random-secret
```

> A default `.env` may already exist. If so, skip this step.

### Step 3 — Start the Backend

```bash
node server.js
```

You should see:
```
Database ready: /path/to/clinic-app/backend/data/clinic.db
Chavan's Child Clinic API running on http://localhost:5000
```

Backend runs on **http://localhost:5000**

### Step 4 — Install Frontend Dependencies

Open a **second terminal** and run:

```bash
cd clinic-app/frontend
npm install
```

### Step 5 — Start the Frontend

```bash
npm run dev
```

Frontend runs on **http://localhost:5173**

### Step 6 — Open the App

Visit **http://localhost:5173** in your browser.

---

## Default Login Credentials

| Role         | Username | Password  |
|--------------|----------|-----------|
| Doctor       | doctor   | doctor123 |
| Receptionist | staff    | staff123  |

> **Change these before deploying to production!**

---

## Project Structure

```
clinic-app/
├── backend/
│   ├── db/
│   │   └── database.js        # SQLite schema + seeding
│   ├── middleware/
│   │   └── auth.js            # JWT middleware + role guard
│   ├── routes/
│   │   ├── auth.js            # Login, /me, profile update
│   │   ├── patients.js        # CRUD patients
│   │   ├── visits.js          # CRUD visits
│   │   ├── prescriptions.js   # CRUD prescriptions
│   │   ├── medicines.js       # Medicines master (upload, search, list, delete)
│   │   └── dashboard.js       # Stats + follow-ups
│   └── server.js              # Express app entry point
│
└── frontend/
    └── src/
        ├── api/               # Axios instance
        ├── context/           # AuthContext (JWT + user state)
        ├── components/Layout/ # Sidebar, Header, Layout wrapper
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── patients/      # List, Form, Detail
        │   ├── visits/        # VisitForm
        │   ├── prescriptions/ # PrescriptionForm, PrescriptionPrint
        │   └── medicines/     # MedicineUpload (Excel upload + master list)
        └── types/             # TypeScript interfaces
```

---

## API Endpoints

### Auth
| Method | Endpoint       | Description       |
|--------|----------------|-------------------|
| POST   | /api/auth/login | Login             |
| GET    | /api/auth/me    | Current user info |

### Patients
| Method | Endpoint            | Description            |
|--------|---------------------|------------------------|
| GET    | /api/patients       | Search + paginate      |
| POST   | /api/patients       | Create patient         |
| GET    | /api/patients/:id   | Get patient details    |
| PUT    | /api/patients/:id   | Update patient         |
| DELETE | /api/patients/:id   | Archive (soft delete)  |

### Visits
| Method | Endpoint                        | Description     |
|--------|---------------------------------|-----------------|
| GET    | /api/patients/:id/visits        | List visits     |
| POST   | /api/patients/:id/visits        | Create visit    |
| GET    | /api/visits/:id                 | Get visit       |
| PUT    | /api/visits/:id                 | Update visit    |

### Prescriptions
| Method | Endpoint                               | Description         |
|--------|----------------------------------------|---------------------|
| GET    | /api/visits/:visitId/prescriptions     | List prescriptions  |
| POST   | /api/visits/:visitId/prescriptions     | Create prescription |
| GET    | /api/prescriptions/:id                 | Get with all items  |
| PUT    | /api/prescriptions/:id                 | Update prescription |

### Dashboard
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/dashboard/stats | Stats + followups   |

### Auth — Profile
| Method | Endpoint            | Description                   |
|--------|---------------------|-------------------------------|
| PUT    | /api/auth/profile   | Update name, username, password |

### Medicines
| Method | Endpoint                    | Access  | Description                              |
|--------|-----------------------------|---------|------------------------------------------|
| GET    | /api/medicines/template     | All     | Download sample `.xlsx` template         |
| GET    | /api/medicines/search?q=... | All     | Autocomplete search (name + description) |
| GET    | /api/medicines              | Doctor  | Paginated list with optional search      |
| POST   | /api/medicines/upload       | Doctor  | Upload `.xlsx`/`.xls` to upsert medicines by name |
| DELETE | /api/medicines/:id          | Doctor  | Soft-delete a medicine                   |

> The Excel file must have a header row with at minimum a `name` column. Optional columns: `description`, `dosage`. Re-uploading the same file updates existing entries and adds new ones — no data is deleted.

---

## Troubleshooting

**Backend won't start**
- Ensure you are running `node server.js` from inside the `backend/` folder
- Check that a `.env` file exists with `PORT` and `JWT_SECRET`
- Run `npm install` again if node_modules is missing

**Frontend blank or API errors**
- Make sure the backend is running on port 5000 before opening the frontend
- The Vite dev server proxies `/api` → `http://localhost:5000` automatically

**Port already in use**
```bash
# Kill all node processes (Windows PowerShell)
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Excel upload fails with "Upload failed"**
- Ensure the file is a valid `.xlsx` or `.xls` file (not a CSV or renamed file)
- The first row must be a header row containing at least a `name` column
- Download the template from the Medicines page to use as a starting point
- File size limit is 10 MB

**Medicines menu item not visible**
- The Medicines section is visible only to the **Doctor** role. Log in as `doctor` to access it.

---

## Security Notes

- Passwords hashed with bcrypt (cost 10)
- JWT tokens expire in 12 hours
- Role-based API guards (doctor-only for write operations)
- Soft deletes only — no data is permanently destroyed
- SQL queries use parameterized statements (no SQL injection)
- Change `JWT_SECRET` in `backend/.env` before deploying to production
