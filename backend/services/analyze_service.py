from typing import Any

from langchain_community.vectorstores import FAISS

from agents.crew_factory import build_crew


def _build_raw_input(patient_data: dict, data_id: str, drug: str) -> str:
    return (
        f"PATIENT: {patient_data['name']} (DOB: {patient_data['dob']}, ID: {data_id})\n"
        f"CURRENT DRUG: {patient_data['drug']}\n"
        f"REQUESTED ANALYSIS DRUG: {drug}\n"
        f"HISTORY: {patient_data['history']}"
    )


def _retrieve_rag_context(vector_db: FAISS, drug: str, k: int = 3) -> str:
    docs = vector_db.similarity_search(drug, k=k)
    if not docs:
        return "No additional history excerpts retrieved."
    return "\n".join(doc.page_content for doc in docs)


def _extract_crew_result(result: Any) -> str:
    if result is None:
        return ""
    if hasattr(result, "raw") and result.raw:
        return str(result.raw)
    return str(result)


def run_analyze_crew(
    patient_data: dict,
    data_id: str,
    drug: str,
    vector_db: FAISS,
) -> str:
    raw_input = _build_raw_input(patient_data, data_id, drug)
    rag_context = _retrieve_rag_context(vector_db, drug)
    print(f"Raw Input: {raw_input}")
    print(f"RAG Context: {rag_context}")
    crew = build_crew(raw_input, rag_context, drug)
    result = crew.kickoff()
    return _extract_crew_result(result)

async def run_analyze_crew_async(
    patient_data: dict,
    data_id: str,
    drug: str,
    vector_db: FAISS,
) -> str:
    raw_input = _build_raw_input(patient_data, data_id, drug)
    rag_context = _retrieve_rag_context(vector_db, drug)

    crew = build_crew(raw_input, rag_context, drug)
    result = await crew.kickoff_async()
    return _extract_crew_result(result)
