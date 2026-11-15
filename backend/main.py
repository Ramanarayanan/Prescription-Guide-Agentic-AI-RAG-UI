import os
import re
from typing import Dict, List, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from services.analyze_service import run_analyze_crew, run_analyze_crew_async
from azure.ai.inference import EmbeddingsClient
from azure.core.credentials import AzureKeyCredential
from openai import AzureOpenAI
import requests
import json
from langchain_core.embeddings import Embeddings
import traceback
import numpy as np
# AI Imports
# from langchain_openai import ChatOpenAI
# from langchain_groq import ChatGroq
# `OpenAIEmbeddings` can vary by langchain version; import it dynamically in `get_embeddings()`.
# Defer heavy imports (FAISS, RecursiveCharacterTextSplitter) to runtime to avoid
# pulling in large ML libraries during module import.

# 1. Setup
load_dotenv()
app = FastAPI(title="Medical Agent Application", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
os.environ["HF_HOME"] = ""
# Load API keys/endpoints from environment without unsafe defaults
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or None
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT") or None
MODEL_NAME = os.getenv("AZURE_OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION") or os.getenv("OPENAI_API_VERSION") or "2024-02-01"
if AZURE_ENDPOINT:
    os.environ["AZURE_ENDPOINT"] = AZURE_ENDPOINT
AZURE_API_KEY = os.getenv("AZURE_API_KEY") or None
AZURE_OPENAI_EMBEDDINGS_KEY = (
    os.getenv("AZURE_OPENAI_EMBEDDINGS_KEY")
    or os.getenv("AZURE_OPENAI_EMBEDDING_KEY")
    or os.getenv("AZURE_OPENAI_API_KEY")
    or AZURE_API_KEY
)

# llm = ChatOpenAI(
#    model=OPENAI_MODEL,
#   temperature=0.1,
#     api_key=OPENAI_API_KEY or None,
# )
# llm =  ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1)


def _normalize_azure_embeddings_endpoint(endpoint: str | None) -> str | None:
    if not endpoint:
        return None
    value = endpoint.strip().rstrip("/")
    for suffix in ("/openai/v1/responses", "/openai", "/models"):
        if value.endswith(suffix):
            value = value[: -len(suffix)]
            break
    return value or None


_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        embedding_key = AZURE_OPENAI_EMBEDDINGS_KEY or AZURE_API_KEY
        if not embedding_key:
            raise RuntimeError(
                "Azure embedding key not configured. Set AZURE_OPENAI_EMBEDDINGS_KEY, AZURE_OPENAI_EMBEDDING_KEY, AZURE_OPENAI_API_KEY, or AZURE_API_KEY in environment"
            )

        embedding_endpoint = (
            os.getenv("AZURE_OPENAI_EMBEDDINGS_ENDPOINT")
            or os.getenv("AZURE_EMBEDDINGS_ENDPOINT")
            or os.getenv("AZURE_OPENAI_ENDPOINT")
            or AZURE_ENDPOINT
        )
        
        endpoint = _normalize_azure_embeddings_endpoint(embedding_endpoint)
        if not endpoint:
            raise RuntimeError(
                "Azure embeddings endpoint not configured. Set AZURE_EMBEDDINGS_ENDPOINT, AZURE_OPENAI_ENDPOINT, or AZURE_ENDPOINT in environment"
            )

        deployment = (
            os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME")
            or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
            or MODEL_NAME
        )

        print(f"[DEBUG] Azure Embeddings initialized:")
        print(f"  Endpoint: {endpoint}")
        print(f"  Deployment/Model: {deployment}")
        print(f"  Key length: {len(embedding_key) if embedding_key else 0}")

        class AzureEmbeddingsWrapper(Embeddings):
            def __init__(self, client, model: str):
                self.client = client
                self.model = model

            def embed_documents(self, texts):
                """Return embeddings vectors using the configured Azure endpoint."""
                if isinstance(self.client, dict):
                    endpoint = self.client.get("endpoint")
                    key = self.client.get("key")
                else:
                    endpoint = self.client.get("endpoint") if hasattr(self.client, "get") else None
                    key = self.client.get("key") if hasattr(self.client, "get") else None

                if not endpoint or not key:
                    raise RuntimeError("Azure embeddings endpoint or key not configured for embeddings client.")

                if "services.ai.azure.com" in endpoint:
                    inference_endpoint = endpoint if endpoint.endswith("/models") else f"{endpoint}/models"
                    try:
                        print(f"[DEBUG] Using Azure AI Inference EmbeddingsClient with endpoint: {inference_endpoint}")
                        client = EmbeddingsClient(endpoint=inference_endpoint, credential=AzureKeyCredential(key))
                    except Exception as exc:
                        raise RuntimeError(f"Failed to construct Azure AI Inference EmbeddingsClient: {exc}")
                    try:
                        response = client.embed(input=texts, model=self.model)
                    except Exception as exc:
                        raise RuntimeError(f"Error calling Azure AI Inference embeddings endpoint: {exc}")
                else:
                    try:
                        client = AzureOpenAI(
                            azure_endpoint=endpoint,
                            api_key=key,
                            api_version=AZURE_OPENAI_API_VERSION,
                        )
                    except Exception as exc:
                        raise RuntimeError(f"Failed to construct Azure OpenAI client: {exc}")
                    try:
                        response = client.embeddings.create(model=self.model, input=texts)
                    except Exception as exc:
                        raise RuntimeError(f"Error calling Azure OpenAI embeddings endpoint: {exc}")

                embeddings = []
                if not hasattr(response, "data"):
                    raise RuntimeError(f"Unexpected Azure embeddings response structure: {response}")

                for item in response.data:
                    emb = getattr(item, "embedding", None)
                    if emb is None:
                        raise RuntimeError(f"Embedding item missing 'embedding' attribute: {item}")
                    try:
                        arr = np.asarray(emb, dtype=np.float32).reshape(-1)
                        embeddings.append(arr.tolist())
                    except Exception:
                        embeddings.append(emb)

                try:
                    info = [
                        (type(e).__name__, getattr(e, "__len__", lambda: None)() if hasattr(e, "__len__") else None)
                        for e in embeddings
                    ]
                except Exception:
                    info = str(type(embeddings))
                print("[DEBUG] embed_documents produced embeddings info:", info)
                return embeddings

            def __call__(self, texts):
                """Make the wrapper callable to satisfy libraries that expect an embedding function."""
                return self.embed_documents(texts)

            def embed_query(self, text):
                vals = self.embed_documents([text])
                vec = vals[0]
                try:
                    flat = np.asarray(vec, dtype=np.float32).reshape(-1).tolist()
                except Exception:
                    flat = vec
                print("[DEBUG] embed_query produced type:", type(flat).__name__, "length:", (len(flat) if hasattr(flat, '__len__') else None))
                return flat

        _embeddings = AzureEmbeddingsWrapper({"endpoint": endpoint, "key": embedding_key}, deployment)

    return _embeddings

def _normalize_patient_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (name or "").strip().lower()).strip("_")


def _canonicalize_patient_name(name: str) -> str:
    return re.sub(r"\s+", " ", (name or "").strip())


def _get_patient_data_key(name: str, dob: str) -> str:
    return f"{_normalize_patient_name(name)}_{(dob or '').strip()}"


def _resolve_patient_data_key(name: str, dob: str) -> str:
    preferred_key = _get_patient_data_key(name, dob)
    if preferred_key in data_store:
        return preferred_key

    normalized_name = _normalize_patient_name(name)
    normalized_dob = (dob or '').strip()
    for key, record in data_store.items():
        if (
            _normalize_patient_name(record.get("name", "")) == normalized_name
            and str(record.get("dob", "")).strip() == normalized_dob
        ):
            return key

    return preferred_key


# In-memory storage
data_store: Dict[str, Dict] = {}
vector_stores: Dict[str, Any] = {}

# 2. Data Models
class StoreRequest(BaseModel):
    name: str
    dob: str
    history: str
    drug: str

class StoreResponse(BaseModel):
    id: str
    message: str

class ContextResponse(BaseModel):
    id: str
    name: str
    dob: str
    history: str
    drug: str

class AnalyzeRequest(BaseModel):
    drug: str

# 3. Endpoints

@app.post("/store", response_model=StoreResponse)
async def store_patient_data(request: StoreRequest):
    """Store patient history using a unique key derived from name and DOB."""
    canonical_name = _canonicalize_patient_name(request.name)
    data_key = _get_patient_data_key(canonical_name, request.dob)

    data_store[data_key] = {
        "name": canonical_name,
        "dob": request.dob.strip(),
        "history": request.history.strip(),
        "drug": request.drug.strip()
    }

    # Create vector database (defer heavy imports until needed)
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_community.vectorstores import FAISS

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=100)
    chunks = text_splitter.split_text(request.history)
    # Pass the embeddings object instance (provides `embed_documents`) instead of a plain function
    vector_stores[data_key] = FAISS.from_texts(chunks, get_embeddings())

    return StoreResponse(id=data_key, message=f"Data stored for {request.name}")

@app.get("/patient-details", response_model=ContextResponse)
async def get_patient_details(
    name: str = Query(..., description="Patient Full Name"),
    dob: str = Query(..., description="Date of Birth (YYYY-MM-DD)")
):
    """Retrieve patient details from vector database using name and DOB."""
    data_key = _resolve_patient_data_key(name, dob)

    if data_key not in data_store:
        raise HTTPException(status_code=404, detail="Patient record not found.")

    p = data_store[data_key]
    return ContextResponse(id=data_key, name=p["name"], dob=p["dob"], history=p["history"], drug=p["drug"])

@app.get("/patients", response_model=List[ContextResponse])
async def list_patients(
    name: str = Query(..., min_length=1, description="Partial name match")
):
    """Search stored patients by name (case-insensitive partial match)."""
    query = name.lower().strip()
    return [
        ContextResponse(id=k, name=v["name"], dob=v["dob"],
                        history=v["history"], drug=v["drug"])
        for k, v in data_store.items()
        if query in v["name"].lower()
    ]

@app.post("/analyze/{data_id}")
async def analyze_medication(data_id: str, request: AnalyzeRequest):
    # Require at least one API key: OpenAI or Azure
    # if not (OPENAI_API_KEY or AZURE_API_KEY):
    #     raise HTTPException(status_code=503, detail="OpenAI or Azure API key not configured.")

    if data_id not in data_store or data_id not in vector_stores:
        raise HTTPException(status_code=404, detail="Patient data/index not found")

    patient_data = data_store[data_id]
    vector_db = vector_stores[data_id]
    print(f"[DEBUG] Analyzing medication for patient {patient_data['name']} with drug {request.drug}")
    # Delegate analysis to crew-based service
    print("[DEBUG] vector_db.embedding_function type:", type(getattr(vector_db, 'embedding_function', None)) )
    try:
        from langchain_core.embeddings import Embeddings as LCEmb
        print("[DEBUG] isinstance Embeddings:", isinstance(getattr(vector_db, 'embedding_function', None), LCEmb))
    except Exception:
        pass

    try:
        result = await run_analyze_crew_async(patient_data, data_id, request.drug, vector_db)
    except Exception as e:
        tb = traceback.format_exc()
        print("[ERROR] Analysis exception traceback:\n", tb)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    return {"result": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
