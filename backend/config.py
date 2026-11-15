import os

# Azure / OpenAI configuration for backend LLMs
# Prefer explicit AZURE_* env vars, fall back to OPENAI_* if present.
AZURE_API_KEY = os.getenv("AZURE_API_KEY", os.getenv("OPENAI_API_KEY", ""))
AZURE_ENDPOINT = os.getenv(
    "AZURE_ENDPOINT", "")
AZURE_MODEL = os.getenv("AZURE_MODEL", "gpt-4.1-nano")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION", "2024-05-01-preview")

# Also set the Azure OpenAI specific env var names some providers expect
# Prefer explicit AZURE_OPENAI_* env vars if already set, otherwise populate
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", AZURE_API_KEY)
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", AZURE_ENDPOINT)
# Deployment name (Azure OpenAI deployment identifier). Allow override.
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv(
    "AZURE_OPENAI_DEPLOYMENT_NAME", AZURE_MODEL.split("/")[-1]
)

if AZURE_OPENAI_API_KEY:
    os.environ.setdefault("AZURE_OPENAI_API_KEY", AZURE_OPENAI_API_KEY)
if AZURE_OPENAI_ENDPOINT:
    os.environ.setdefault("AZURE_OPENAI_ENDPOINT", AZURE_OPENAI_ENDPOINT)
if AZURE_OPENAI_DEPLOYMENT_NAME:
    os.environ.setdefault("AZURE_OPENAI_DEPLOYMENT_NAME", AZURE_OPENAI_DEPLOYMENT_NAME)

def get_azure_llm_params():
    """Return a dict of parameters suitable for constructing the LLM.

    Keys include both generic names and Azure-specific deployment info so
    callers or libraries that check env vars will have the expected values.
    """
    return {
        "model": AZURE_MODEL,
        "api_key": AZURE_API_KEY,
        "end_point": AZURE_ENDPOINT,
        "api_version": AZURE_API_VERSION,
        "deployment_name": AZURE_OPENAI_DEPLOYMENT_NAME,
    }