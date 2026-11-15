import os

from crewai import Agent, Crew, LLM, Task

from data.clinical_protocols import CLINICAL_PROTOCOLS
from config import get_azure_llm_params

VERDICT_FORMAT_INSTRUCTIONS = """
Format the final report as markdown with these sections:
### Clinical Safety Analysis
#### Patient History Context
#### New Prescription
### Analysis
### Verdict
"""


# def _get_llm() -> LLM:
#     return LLM(
#         model=f"groq/llama-3.3-70b-versatile",
#         # api_key=OPENAI_API_KEY,
#         api= OPENAI_API_KEY,  # Groq uses "api" instead of "api_key" for the key name
#         temperature=0.1,
#     )

def _get_llm() -> LLM:
    params = get_azure_llm_params() or {}
    deployment = (
        os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME")
        or os.environ.get("AZURE_MODEL")
        or params.get("deployment_name")
        or "gpt-4.1-nano"
    )
    api_key = os.environ.get("AZURE_API_KEY") or params.get("api_key")
    endpoint = os.environ.get("AZURE_ENDPOINT") or params.get("end_point")

    if endpoint:
        endpoint = endpoint.strip().rstrip("/")
        if not endpoint.endswith("/openai/v1"):
            endpoint = f"{endpoint}/openai/v1"

    print(f"LLM Params - Deployment: {deployment}, Endpoint: {endpoint}, API Key Set: {bool(api_key)}")
    if not deployment or not api_key or not endpoint:
        raise RuntimeError(
            "Missing Azure OpenAI configuration: set AZURE_API_KEY, AZURE_ENDPOINT, and AZURE_MODEL or AZURE_OPENAI_DEPLOYMENT_NAME."
        )

    return LLM(
        model=f"openai/{deployment}",
        api_key=api_key,
        base_url=endpoint,
    )



def build_crew(raw_input: str, rag_context: str, drug: str) -> Crew:
    llm = _get_llm()
    protocols_text = "\n".join(CLINICAL_PROTOCOLS)

    archivist = Agent(
        role="Archivist Agent",
        goal="Ensure structural integrity and digitize raw medical input",
        backstory="You are an expert at extracting structured data from messy clinical notes.",
        llm=llm,
        verbose=False,
    )

    guardian = Agent(
        role="Guardian Agent",
        goal="Privacy Audit: Redact all PII (Names, IDs, Phone numbers)",
        backstory="You ensure no sensitive identity data is leaked in the clinical report.",
        llm=llm,
        verbose=False,
    )

    scribe = Agent(
        role="Scribe Agent",
        goal="Condense medical history into short, clinical bullet points",
        backstory="You summarize complex patient histories for quick physician review.",
        llm=llm,
        verbose=False,
    )

    orchestrator = Agent(
        role="Clinical Agent Orchestrator",
        goal="Perform RAG search and provide a safety verdict based on clinical reasoning",
        backstory="You compare summarized patient data against protocols to decide safety.",
        llm=llm,
        verbose=False,
    )

    task_digitize = Task(
        description=f"Extract key medical facts from the following raw patient input:\n\n{raw_input}",
        expected_output="A structured list of symptoms, allergies, conditions, and medical history.",
        agent=archivist,
    )

    task_privacy = Task(
        description="Scan the structured data and redact any names, ID numbers, or other PII.",
        expected_output="Anonymized medical data with PII removed.",
        agent=guardian,
        context=[task_digitize],
    )

    task_summarize = Task(
        description="Condense the anonymized data into exactly 3 clinical bullet points, including a clear patient history summary and key conditions/allergies.",
        expected_output="Concise medical summary with 3 bullet points, including patient history context.",
        agent=scribe,
        context=[task_privacy],
    )

    task_verdict = Task(
        description=f"""Using the summarized patient profile, produce a full clinical safety report.

Patient history (raw input):
{raw_input}

Patient history RAG context (relevant excerpts):
{rag_context}

Clinical protocols reference:
{protocols_text}

Drug to analyze: {drug}

Your output must be a markdown document with these exact sections:
### Clinical Safety Analysis
#### Patient History Context
- Include the relevant patient history from the raw input and any extracted conditions/allergies.
#### New Prescription
### Analysis
### Verdict

Provide a detailed analysis covering allergies, drug interactions, and diabetes or chronic condition considerations where relevant.
""",
        expected_output=f"""A markdown document matching this exact structural template, filling in the relevant clinical details for each section:

{VERDICT_FORMAT_INSTRUCTIONS}

Note: Do not omit any sections, do not change the heading levels, and Provide a verdict: [SUITABLE], [CAUTION], or [NOT RECOMMENDED].""",
        agent=orchestrator,
        context=[task_privacy, task_summarize],
    )

    return Crew(
        agents=[archivist, guardian, scribe, orchestrator],
        tasks=[task_digitize, task_privacy, task_summarize, task_verdict],
        verbose=False,
    )
