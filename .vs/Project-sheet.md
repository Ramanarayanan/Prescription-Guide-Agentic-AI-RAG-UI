# Project Cheat Sheet

## 1. Architecture Overview

### Frontend
- Built with React + TypeScript + Vite.
- Main app entry is [src/App.tsx](../src/App.tsx).
- The app shell is driven by [src/components/layout/AppLayout.tsx](../src/components/layout/AppLayout.tsx), which renders a tabbed UI for the four main workflows.

### Frontend structure
- [src/pages](../src/pages): feature screens
  - [src/pages/StorePatientPage.tsx](../src/pages/StorePatientPage.tsx): register a patient
  - [src/pages/SearchPatientPage.tsx](../src/pages/SearchPatientPage.tsx): look up a patient by name and DOB
  - [src/pages/AnalyzeMedicationPage.tsx](../src/pages/AnalyzeMedicationPage.tsx): run AI medication analysis
  - [src/pages/PatientListPage.tsx](../src/pages/PatientListPage.tsx): list/search patients by partial name
- [src/components](../src/components): reusable UI building blocks
  - [src/components/layout](../src/components/layout): header/footer/tab layout
  - [src/components/patient](../src/components/patient): patient cards and detail views
  - [src/components/analysis](../src/components/analysis): analysis rendering and parsing UI
- [src/services](../src/services): API communication layer
  - [src/services/apiClient.ts](../src/services/apiClient.ts): low-level fetch wrapper and error handling
  - [src/services/patientApi.ts](../src/services/patientApi.ts): domain-specific API helpers
- [src/types/patient.ts](../src/types/patient.ts): shared request/response TypeScript models
- [src/utils](../src/utils): small helper utilities
  - [src/utils/formatDate.ts](../src/utils/formatDate.ts): DOB helpers
  - [src/utils/parseAnalysisResult.ts](../src/utils/parseAnalysisResult.ts): analysis text parser

### Backend
- FastAPI service lives in [backend/main.py](../backend/main.py).
- AI analysis flow is handled in [backend/services/analyze_service.py](../backend/services/analyze_service.py).
- Crew-based agent orchestration is configured in [backend/agents/crew_factory.py](../backend/agents/crew_factory.py).
- Clinical reference text is stored in [backend/data/clinical_protocols.py](../backend/data/clinical_protocols.py).

### Backend data model
- Patient records are stored in memory on the server.
- They are not persisted to a database.
- A restart clears stored records.

---

## 2. Key Components and Patterns

### React patterns in use
- Functional components with hooks, especially useState.
- Page-level state is managed inside each feature page.
- Small presentational components are used to keep UI logic reusable and readable.
- MUI is used for layout and styling, including Tabs, Alerts, Buttons, TextField, and DatePicker.

### Common UI pattern
Most pages follow the same pattern:
1. Local state holds form values.
2. A submit handler validates the input.
3. A service call is made.
4. Loading and error states are shown.
5. Successful data is displayed in a child component.

### Error/loading handling pattern
- Use a local loading state while requests are in flight.
- Surface failures with MUI Alert components.
- Use the shared ApiError type so HTTP failures are handled consistently.

---

## 3. API and Data Flow

### Frontend to backend flow
1. A page collects input from the user.
2. The page calls a function from [src/services/patientApi.ts](../src/services/patientApi.ts).
3. That service delegates to [src/services/apiClient.ts](../src/services/apiClient.ts).
4. apiClient uses fetch to call the FastAPI server.
5. The backend responds with JSON.
6. The page updates local state and renders the result.

### Main API endpoints
- POST /store: create or overwrite a patient record
- GET /patient-details: retrieve a patient by name + DOB
- GET /patients: search patients by partial name
- POST /analyze/{data_id}: run AI analysis for a stored patient

### Analysis flow
- The analysis page first looks up the patient by name and DOB.
- It then posts the drug to /analyze/{data_id}.
- The backend builds a prompt using patient history and a FAISS-based retrieval context.
- CrewAI agents produce a markdown clinical safety report.
- The frontend parses and renders that markdown into a structured display.

---

## 4. Reusable Utilities and Helpers

Use these existing helpers instead of rewriting them:

### Date helpers
- [src/utils/formatDate.ts](../src/utils/formatDate.ts)
  - formatDob(date): converts Dayjs to YYYY-MM-DD
  - isValidDob(date): validates picked dates

### API helpers
- [src/services/apiClient.ts](../src/services/apiClient.ts)
  - apiGet(path, params)
  - apiPost(path, body)
  - ApiError: standardizes HTTP errors

### Analysis parsing helpers
- [src/utils/parseAnalysisResult.ts](../src/utils/parseAnalysisResult.ts)
  - parseAnalysisResult(rawText): turns AI markdown into structured sections
  - verdictSeverity(level): maps verdict levels to MUI severity colors

### Shared data models
- [src/types/patient.ts](../src/types/patient.ts)
  - Use these interfaces for request and response payloads to avoid ad-hoc typing.

### Existing UI components
- [src/components/analysis/AnalysisResultDisplay.tsx](../src/components/analysis/AnalysisResultDisplay.tsx): render AI analysis output
- [src/components/patient/PatientDetailsDisplay.tsx](../src/components/patient/PatientDetailsDisplay.tsx): render patient details consistently

---

## 5. Quick Start Reminders

### Frontend
- npm install
- npm run dev

### Backend
- cd backend
- pip install -r requirements.txt
- python main.py

### Environment notes
- Frontend base URL comes from [src/config/env.ts](../src/config/env.ts).
- Backend configuration depends on environment variables in the backend .env file.

---

## 6. Good places to start when editing
- Need to change a page flow? Start in [src/pages](../src/pages).
- Need to change API behavior? Start in [src/services/patientApi.ts](../src/services/patientApi.ts) and [backend/main.py](../backend/main.py).
- Need to change how analysis text is displayed? Start in [src/utils/parseAnalysisResult.ts](../src/utils/parseAnalysisResult.ts) and [src/components/analysis](../src/components/analysis).
--project-sheet.md