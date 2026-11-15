# Hospital Management System

A React-based web application for managing patient records and running AI-powered prescription analysis. The frontend uses **Material UI** with tabbed navigation; the backend is a **FastAPI** service with CrewAI multi-agent analysis, OpenAI LLM, and FAISS vector search.

## Features

| Tab | Description |
|-----|-------------|
| **Register Patient** | Store patient name, date of birth, medical history, and drug |
| **Find Patient** | Look up a patient by name and date of birth |
| **Prescription Analysis** | AI analysis of a drug against patient history (SUITABLE / CAUTION / NOT RECOMMENDED) |
| **Patient List** | Search patients by partial name match |

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Material UI (MUI) v9
- MUI Date Pickers + dayjs

**Backend**
- FastAPI
- CrewAI (Archivist, Guardian, Scribe, Orchestrator agents) + OpenAI (default `gpt-4o-mini`)
- LangChain + HuggingFace embeddings + FAISS vector store
- In-memory patient storage

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **OpenAI API key** — [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Quick Start

### 1. Backend

```powershell
cd backend
pip install -r requirements.txt
```

Create `backend/.env` (copy from `backend/.env.example`):

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

Start the API server:

```powershell
python main.py
```

The API runs at **http://localhost:8000**. Interactive docs: **http://localhost:8000/docs**

### 2. Frontend

```powershell
cd ..
npm install
copy .env.example .env
npm run dev
```

Open **http://localhost:5173** in your browser.

## Environment Variables

| File | Variable | Description | Default |
|------|----------|-------------|---------|
| `.env` (frontend) | `VITE_API_BASE_URL` | FastAPI base URL | `http://localhost:8000` |
| `backend/.env` | `OPENAI_API_KEY` | OpenAI API key for LLM analysis | — |
| `backend/.env` | `OPENAI_MODEL` | OpenAI chat model | `gpt-4o-mini` |

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI Medical Agent API
│   ├── agents/              # CrewAI crew factory
│   ├── services/            # Analyze service (crew kickoff)
│   ├── data/                # Clinical protocols
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   └── DOCUMENTATION.md     # Detailed technical documentation
├── public/
│   └── favicon.svg
├── src/
│   ├── components/layout/   # Header, Footer, AppLayout (tabs)
│   ├── pages/               # Four feature screens
│   ├── services/            # API client and patient API calls
│   ├── types/               # TypeScript interfaces
│   ├── config/              # Environment config
│   └── utils/               # Date formatting helpers
├── .env.example
├── package.json
└── README.md
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## API Endpoints (Summary)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/store` | Register or update a patient |
| `GET` | `/patient-details` | Get patient by name + DOB |
| `GET` | `/patients` | List patients by partial name |
| `POST` | `/analyze/{data_id}` | AI prescription analysis |

See [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) for full API reference, screen flows, and architecture details.

## Typical Workflow

1. **Register** a patient with name, DOB, history, and drug.
2. **Find Patient** to verify the record was saved.
3. **Prescription Analysis** — enter the same patient and a drug; the AI returns a suitability verdict.
4. **Patient List** — search by first or last name to see matching records.

## Notes

- Patient records are stored **in memory** on the backend and are lost when the server restarts.
- Registering a patient with the same name and DOB **overwrites** the existing record.
- Prescription analysis may take **up to 2 minutes** while the CrewAI agent pipeline runs.
- Date of birth must be in **YYYY-MM-DD** format when sent to the API.

## License

Private project — not licensed for public distribution unless specified otherwise.
