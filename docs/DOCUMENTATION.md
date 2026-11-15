# Hospital Management System — Documentation

This document describes the architecture, API integration, UI screens, and development guide for the Hospital Management System.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Backend API Reference](#3-backend-api-reference)
4. [Frontend Application](#4-frontend-application)
5. [Screen-by-Screen Guide](#5-screen-by-screen-guide)
6. [Data Models](#6-data-models)
7. [Configuration](#7-configuration)
8. [Setup and Deployment](#8-setup-and-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. System Overview

The Hospital Management System is a full-stack application consisting of:

- **React frontend** — Material UI web app with four tabbed screens for patient management.
- **FastAPI backend** — Medical Agent API that stores patient data, indexes medical history in a FAISS vector store, and uses a CrewAI 4-agent pipeline with OpenAI for prescription analysis.

### Purpose

| Capability | Description |
|------------|-------------|
| Patient registration | Capture name, DOB, medical history, and current drug |
| Patient lookup | Retrieve full record by exact name + DOB |
| Prescription analysis | AI verdict on whether a drug is suitable given patient history |
| Patient search | Find all patients whose name partially matches a search term |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Register │ │   Find   │ │Prescript.│ │  List    │       │
│  │ Patient  │ │ Patient  │ │ Analysis │ │ Patients │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│              src/services/patientApi.ts                      │
│              src/services/apiClient.ts                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP (fetch)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (port 8000)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  data_store │  │ vector_stores│  │ CrewAI_OpenAI   │  │
│  │  (in-memory)│  │ (FAISS index)│  │ llama-3.3-70b   │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Patient ID Generation

Each patient is keyed internally as:

```
{name.lower().replace(' ', '_')}_{dob}
```

Example: `Jane Doe` born `1990-05-15` → `jane_doe_1990-05-15`

This ID is returned as `id` in API responses and used for the analyze endpoint.

---

## 3. Backend API Reference

**Base URL:** `http://localhost:8000`  
**Swagger UI:** `http://localhost:8000/docs`  
**CORS:** Enabled for all origins

### POST `/store`

Register or update a patient record. Re-registering the same name + DOB overwrites the existing record and rebuilds the FAISS index.

**Request body:**

```json
{
  "name": "Jane Doe",
  "dob": "1990-05-15",
  "history": "Patient has hypertension and type 2 diabetes...",
  "drug": "Aspirin"
}
```

**Response (200):**

```json
{
  "id": "jane_doe_1990-05-15",
  "message": "Data stored for Jane Doe"
}
```

---

### GET `/patient-details`

Retrieve a single patient by exact name and date of birth.

**Query parameters:**

| Parameter | Type | Required | Format |
|-----------|------|----------|--------|
| `name` | string | Yes | Full patient name |
| `dob` | string | Yes | `YYYY-MM-DD` |

**Example:**

```
GET /patient-details?name=Jane%20Doe&dob=1990-05-15
```

**Response (200):**

```json
{
  "id": "jane_doe_1990-05-15",
  "name": "Jane Doe",
  "dob": "1990-05-15",
  "history": "Patient has hypertension...",
  "drug": "Aspirin"
}
```

**Error (404):**

```json
{
  "detail": "Patient record not found."
}
```

---

### GET `/patients`

Search patients by partial name (case-insensitive).

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes (min 1 char) | Partial name match |

**Example:**

```
GET /patients?name=Jane
```

**Response (200):**

```json
[
  {
    "id": "jane_doe_1990-05-15",
    "name": "Jane Doe",
    "dob": "1990-05-15",
    "history": "Patient has hypertension...",
    "drug": "Aspirin"
  }
]
```

Returns an empty array `[]` when no matches are found (not a 404).

---

### POST `/analyze/{data_id}`

Run AI-powered medication analysis for a patient. Uses FAISS to retrieve relevant history chunks, then a CrewAI crew (Archivist, Guardian, Scribe, Orchestrator) with OpenAI to produce a structured clinical report and verdict.

**Path parameter:**

| Parameter | Description |
|-----------|-------------|
| `data_id` | Patient ID (e.g. `jane_doe_1990-05-15`) |

**Request body:**

```json
{
  "drug": "Ibuprofen"
}
```

**Response (200):**

```json
{
  "result": "Based on the patient history... [CAUTION] ..."
}
```

**Error (404):**

```json
{
  "detail": "Patient data/index not found"
}
```

**Note:** Analysis typically takes 1–2 minutes due to the multi-agent CrewAI pipeline (4 sequential LLM tasks).

---

## 4. Frontend Application

### Directory Structure

```
src/
├── main.tsx                 # App entry, MUI theme, date picker provider
├── App.tsx                  # Renders AppLayout
├── theme.ts                 # MUI theme (teal/blue hospital palette)
├── config/
│   └── env.ts               # VITE_API_BASE_URL
├── types/
│   └── patient.ts           # StoreRequest, PatientRecord, etc.
├── services/
│   ├── apiClient.ts         # fetch wrapper, ApiError, GET/POST helpers
│   └── patientApi.ts        # storePatient, getPatientDetails, etc.
├── utils/
│   └── formatDate.ts        # dayjs DOB formatting (YYYY-MM-DD)
├── components/layout/
│   ├── Header.tsx           # Gradient AppBar with title
│   ├── Footer.tsx           # Decorative footer
│   └── AppLayout.tsx        # Tabs + page routing
└── pages/
    ├── StorePatientPage.tsx
    ├── SearchPatientPage.tsx
    ├── AnalyzeMedicationPage.tsx
    └── PatientListPage.tsx
```

### API Service Layer

All HTTP calls go through `src/services/apiClient.ts`:

- Prefixes requests with `VITE_API_BASE_URL`
- Sets `Content-Type: application/json` on POST requests
- Parses FastAPI error `detail` field into user-friendly messages
- Throws `ApiError` with `message` and `status` on non-2xx responses

`src/services/patientApi.ts` exposes four functions used by the pages:

| Function | Endpoint |
|----------|----------|
| `storePatient(body)` | `POST /store` |
| `getPatientDetails(name, dob)` | `GET /patient-details` |
| `analyzeMedication(dataId, drug)` | `POST /analyze/{dataId}` |
| `searchPatientsByName(name)` | `GET /patients` |

### Layout and Navigation

- **Header** — gradient AppBar with hospital icon and system title.
- **Tabs** — MUI scrollable tabs with icons; switches between four page components without React Router.
- **Footer** — copyright and API version label.
- **Content** — each page rendered inside a MUI `Paper` card within a `Container maxWidth="md"`.

---

## 5. Screen-by-Screen Guide

### Tab 1: Register Patient

**File:** `src/pages/StorePatientPage.tsx`  
**API:** `POST /store`

| Field | Type | Required |
|-------|------|----------|
| Patient Name | Text | Yes |
| Date of Birth | Date picker | Yes |
| Drug / Medication | Text | Yes |
| Patient History | Multiline text (8+ rows) | Yes |

**Behavior:**
- Shows info alert that re-registering same name + DOB overwrites the record.
- On success: green alert + snackbar with patient ID; form resets.
- On error: red alert with API message.

---

### Tab 2: Find Patient

**File:** `src/pages/SearchPatientPage.tsx`  
**API:** `GET /patient-details`

| Field | Type | Required |
|-------|------|----------|
| Patient Name | Text | Yes |
| Date of Birth | Date picker | Yes |

**Behavior:**
- Search button disabled until both fields are valid.
- Results shown in a large read-only textarea formatted as:

  ```
  Patient ID: jane_doe_1990-05-15
  Name: Jane Doe
  Date of Birth: 1990-05-15
  Drug: Aspirin

  Patient History:
  ...
  ```

- 404 displays "Patient record not found."

---

### Tab 3: Prescription Analysis

**File:** `src/pages/AnalyzeMedicationPage.tsx`  
**API:** `GET /patient-details` → `POST /analyze/{id}`

| Field | Type | Required |
|-------|------|----------|
| Patient Name | Text | Yes |
| Date of Birth | Date picker | Yes |
| Drug to Analyze | Text | No (defaults to stored drug) |

**Behavior:**
1. Looks up patient by name + DOB.
2. Uses entered drug, or falls back to the drug stored on the patient record.
3. Calls analyze endpoint; shows progress message during LLM wait.
4. Displays AI result in a large read-only textarea (10+ rows).

Expected verdict format: `[SUITABLE]`, `[CAUTION]`, or `[NOT RECOMMENDED]`.

---

### Tab 4: Patient List

**File:** `src/pages/PatientListPage.tsx`  
**API:** `GET /patients`

| Field | Type | Required |
|-------|------|----------|
| Patient Name | Text | Yes (min 1 character) |

**Behavior:**
- Search button disabled until name has at least one character.
- Results in MUI table: Name, DOB, Drug, History (truncated to 80 chars with tooltip), Patient ID.
- Empty results show warning alert.

---

## 6. Data Models

### TypeScript (Frontend)

```typescript
interface StoreRequest {
  name: string;
  dob: string;       // YYYY-MM-DD
  history: string;
  drug: string;
}

interface StoreResponse {
  id: string;
  message: string;
}

interface PatientRecord {
  id: string;
  name: string;
  dob: string;
  history: string;
  drug: string;
}

interface AnalyzeResponse {
  result: string;
}
```

### Python (Backend)

```python
class StoreRequest(BaseModel):
    name: str
    dob: str
    history: str
    drug: str

class ContextResponse(BaseModel):
    id: str
    name: str
    dob: str
    history: str
    drug: str

class AnalyzeRequest(BaseModel):
    drug: str
```

---

## 7. Configuration

### Frontend (`.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
```

Copy from `.env.example`:

```powershell
copy .env.example .env
```

Change the URL if the backend runs on a different host or port.

### Backend (`backend/.env`)

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

The backend also sets:
- `HF_HOME` — HuggingFace model cache (stored in `backend/.cache`)
- LLM model: `OPENAI_MODEL` (default `gpt-4o-mini`) via OpenAI
- Embeddings: `all-MiniLM-L6-v2` via HuggingFace

---

## 8. Setup and Deployment

### Development

**Terminal 1 — Backend:**

```powershell
cd backend
pip install -r requirements.txt
python main.py
```

**Terminal 2 — Frontend:**

```powershell
npm install
npm run dev
```

### Production Build (Frontend)

```powershell
npm run build
npm run preview
```

Output is in the `dist/` folder. Serve with any static file host (nginx, Azure Static Web Apps, etc.). Set `VITE_API_BASE_URL` to your production API URL before building.

### Backend Dependencies

See `backend/requirements.txt`:

```
fastapi
uvicorn
python-dotenv
crewai>=0.80.0
langchain-openai
openai
langchain-community
langchain-huggingface
langchain-text-splitters
faiss-cpu
pydantic
```

---

## 9. Troubleshooting

| Problem | Likely cause | Solution |
|---------|--------------|----------|
| "Failed to save patient. Is the API running?" | Backend not started | Run `python main.py` in `backend/` |
| CORS errors | Backend not reachable | Confirm `VITE_API_BASE_URL` matches backend URL |
| "Patient record not found" | Wrong name/DOB or server restarted | Re-register patient; data is in-memory only |
| Prescription analysis hangs or fails | Missing/invalid `OPENAI_API_KEY` | Set key in `backend/.env` |
| Prescription analysis returns 503 | OpenAI key not configured | Set `OPENAI_API_KEY` in `backend/.env` |
| Patient List returns empty | Name doesn't match any record | Try partial name; check spelling |
| Date format errors | Invalid DOB | Use date picker; API expects `YYYY-MM-DD` |
| Build fails on TypeScript | Dependency mismatch | Run `npm install` and `npm run build` |

### Verify API is running

Open [http://localhost:8000/docs](http://localhost:8000/docs) — you should see the FastAPI Swagger UI with all four endpoints.

### Test with curl

```powershell
# Register a patient
curl -X POST http://localhost:8000/store `
  -H "Content-Type: application/json" `
  -d '{"name":"Jane Doe","dob":"1990-05-15","history":"Hypertension history","drug":"Aspirin"}'

# Find patient
curl "http://localhost:8000/patient-details?name=Jane%20Doe&dob=1990-05-15"

# List patients
curl "http://localhost:8000/patients?name=Jane"
```

---

## Version History

| Version | Description |
|---------|-------------|
| 1.0.0 | Initial release — four tabs, FastAPI integration, AI prescription analysis |
